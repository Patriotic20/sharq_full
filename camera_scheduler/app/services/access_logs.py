"""Оркестратор: забирает access-логи со всех камер и пишет в БД (attendances)."""

import asyncio
import csv
import logging
from collections import Counter
from datetime import datetime, timedelta, timezone

from app.services.attendance import save_attendance
from app.services.camera import list_cameras
from app.services.dahua import DahuaClient

logger = logging.getLogger(__name__)

TZ = timezone(timedelta(hours=5))  # Toshkent UTC+5

METHOD_MAP = {
    15: "Face", 1: "Card", 2: "Password", 3: "Fingerprint",
    4: "Card+Password", 16: "QRCode",
}
ERROR_MAP = {
    0: "OK", 16: "Unknown person", 17: "Wrong password",
    18: "No permission", 19: "Time restriction",
}


def _shift_range(shift: str) -> tuple[datetime, datetime, str]:
    """
    Окна выборки логов в текущем дне:
      morning = сегодня 06:00 → 09:00 (запуск в 09:00, утренний сбор)
      evening = сегодня 06:00 → 20:00 (запуск в 20:00, полный день)
    """
    today = datetime.now(TZ).replace(hour=0, minute=0, second=0, microsecond=0)
    if shift == "morning":
        return today.replace(hour=6), today.replace(hour=9), "MORNING"
    return today.replace(hour=6), today.replace(hour=20), "EVENING"


def _is_valid_record(rec: dict) -> bool:
    """Только успешные проходы с известным сотрудником."""
    return (
        rec.get("Status") == 1
        and bool(rec.get("UserID"))
        and bool(rec.get("CardName"))
    )


def _write_csv(path: str, records: list[dict]) -> None:
    """Дамп в CSV — оставлено для отладки/архива; вызов закомментирован."""
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow([
            "RecNo", "Time (Toshkent)", "UserID", "UserName",
            "Method", "Status", "Result", "ReaderID",
        ])
        for rec in records:
            ts = datetime.fromtimestamp(rec["CreateTime"], tz=TZ)
            w.writerow([
                rec["RecNo"],
                ts.strftime("%Y-%m-%d %H:%M:%S"),
                rec["UserID"] or "—",
                rec["CardName"] or "Noma'lum",
                METHOD_MAP.get(rec["Method"], f"Method-{rec['Method']}"),
                "Muvaffaqiyatli" if rec["Status"] == 1 else "Rad etildi",
                ERROR_MAP.get(rec["ErrorCode"], f"Error-{rec['ErrorCode']}"),
                rec["ReaderID"],
            ])


def _log_top_users(filtered: list[dict], ip: str) -> None:
    users = Counter(r["CardName"] for r in filtered)
    top = ", ".join(f"{name}={count}" for name, count in users.most_common(5))
    if top:
        logger.info("Top users (%s): %s", ip, top)


async def _process_camera(camera: dict, shift: str) -> None:
    ip = camera["ip_address"]
    cam_id = camera["id"]
    start_dt, end_dt, label = _shift_range(shift)
    start_str = start_dt.strftime("%Y-%m-%d %H:%M:%S")
    end_str = end_dt.strftime("%Y-%m-%d %H:%M:%S")
    start_ts, end_ts = int(start_dt.timestamp()), int(end_dt.timestamp())

    logger.info("cam%s (%s) [%s]: %s → %s", cam_id, ip, label, start_str, end_str)

    try:
        async with DahuaClient(ip, camera["login"], camera["password"]) as dahua:
            records = await dahua.fetch_access_records(start_str, end_str)
        logger.info("cam%s (%s): получено %d записей с устройства", cam_id, ip, len(records))

        filtered = [
            r for r in records
            if start_ts <= r["CreateTime"] <= end_ts and _is_valid_record(r)
        ]
        logger.info("cam%s (%s): после фильтра %d записей", cam_id, ip, len(filtered))

        # --- CSV-выгрузка отключена. Чтобы включить — раскомментировать 2 строки ниже ---
        # output_csv = f"access_logs_{label}_{end_dt.strftime('%Y%m%d')}_cam{cam_id}.csv"
        # _write_csv(output_csv, filtered)
        # logger.info("CSV saved: %s", output_csv)

        try:
            stats = await save_attendance(filtered, camera)
            logger.info(
                "cam%s (%s): saved=%d new_employees=%d dedup=%d",
                cam_id, ip, stats["saved"], stats["created_employees"], stats["skipped_dedup"],
            )
        except Exception:
            logger.exception("cam%s (%s): ошибка записи в БД", cam_id, ip)

        _log_top_users(filtered, ip)

    except Exception:
        logger.exception("cam%s (%s): ошибка обработки камеры", cam_id, ip)


async def fetch_access_logs(shift: str) -> None:
    """Точка входа планировщика: пройти по всем камерам параллельно."""
    logger.info("=== Запуск [%s] ===", shift.upper())

    try:
        cameras = await list_cameras()
    except Exception:
        logger.exception("Не удалось получить список камер из БД")
        return

    if not cameras:
        logger.warning("Нет камер в БД")
        return

    logger.info("Найдено камер: %d — обработка параллельно", len(cameras))
    await asyncio.gather(
        *(_process_camera(cam, shift) for cam in cameras),
        return_exceptions=True,
    )
