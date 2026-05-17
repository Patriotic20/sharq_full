import asyncio
import logging
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from sqlalchemy import select

load_dotenv()

from app.core.database import db_helper
from app.models.cameras import Camera
from app.services.dahua import DahuaClient
from app.services.attendance import save_attendance, mark_absentees

# Настроим логирование для скрипта
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

TZ = timezone(timedelta(hours=5))  # Toshkent UTC+5
START_DATE = "2026-01-01"  # ВЫ МОЖЕТЕ ИЗМЕНИТЬ НАЧАЛЬНУЮ ДАТУ ЗДЕСЬ

# Жестко заданные настройки камер
CAMERA_CONFIGS = {
    "192.168.1.90": {"type": "exit", "login": "admin", "password": "admin123"},
    "192.168.1.91": {"type": "enter", "login": "admin", "password": "admin123"},
    "192.168.1.92": {"type": "enter", "login": "admin", "password": "admin123"},
    "192.168.1.93": {"type": "exit", "login": "admin", "password": "admin123"},
}

def _is_valid_record(rec: dict) -> bool:
    """Только успешные проходы с известным сотрудником."""
    return (
        rec.get("Status") == 1
        and bool(rec.get("UserID"))
        and bool(rec.get("CardName"))
    )

async def process_camera_for_day(cam, start_ts, end_ts, day_start_str, day_end_str):
    ip = cam["ip_address"]
    cam_id = cam["id"]
    try:
        async with DahuaClient(ip, cam["login"], cam["password"]) as dahua:
            records = await dahua.fetch_access_records(day_start_str, day_end_str)
        
        filtered = [
            r for r in records
            if start_ts <= r["CreateTime"] <= end_ts and _is_valid_record(r)
        ]
        
        if filtered:
            stats = await save_attendance(filtered, cam)
            logger.info(
                f"  [cam{cam_id}] {ip}: сохранено {stats['saved']} записей "
                f"(создано сотрудников: {stats['created_employees']}, дубликатов пропущено: {stats['skipped_dedup']})"
            )
        else:
            logger.info(f"  [cam{cam_id}] {ip}: нет валидных записей за этот день")
    except Exception as e:
        logger.error(f"  [cam{cam_id}] {ip}: ошибка загрузки ({str(e)})")

async def main():
    logger.info("=== Запуск скрипта загрузки истории ===")

    # 1. Получаем и сохраняем камеры в базу данных (если их там нет)
    cameras_to_process = []
    async with db_helper.session_context() as session:
        result = await session.execute(select(Camera))
        db_cameras = result.scalars().all()
        db_ips = {c.ip_address: c for c in db_cameras}
        
        for ip, conf in CAMERA_CONFIGS.items():
            cam = db_ips.get(ip)
            if cam:
                # Если камера уже есть, просто обновим её логин/пароль/тип на всякий случай
                cam.login = conf["login"]
                cam.password = conf["password"]
                cam.type = conf["type"]
            else:
                # Камеры нет в базе, создаем новую
                cam = Camera(
                    ip_address=ip,
                    login=conf["login"],
                    password=conf["password"],
                    type=conf["type"],
                )
                session.add(cam)
                db_ips[ip] = cam
                
        await session.commit()
        
        # После commit() у новых камер появится id
        for ip, conf in CAMERA_CONFIGS.items():
            cam = db_ips[ip]
            cameras_to_process.append({
                "id": cam.id,
                "ip_address": cam.ip_address,
                "login": cam.login,
                "password": cam.password,
                "type": cam.type,
            })

    if len(cameras_to_process) == 0:
        logger.error("Список камер пуст!")
        return

    logger.info(f"Найдено камер для синхронизации в БД: {len(cameras_to_process)}")

    # 2. Идем по дням
    start_dt = datetime.strptime(START_DATE, "%Y-%m-%d").replace(tzinfo=TZ)
    now = datetime.now(TZ)
    
    current_dt = start_dt
    days_processed = []

    while current_dt.date() <= now.date():
        day_str = current_dt.strftime("%Y-%m-%d")
        
        # Формируем границы дня
        day_start_str = f"{day_str} 00:00:00"
        
        if current_dt.date() == now.date():
            # Если это сегодняшний день, скачиваем до текущего времени
            day_end_str = now.strftime("%Y-%m-%d %H:%M:%S")
            end_ts = int(now.timestamp())
        else:
            # Для полных прошедших дней скачиваем до конца суток
            day_end_str = f"{day_str} 23:59:59"
            end_dt = current_dt.replace(hour=23, minute=59, second=59)
            end_ts = int(end_dt.timestamp())
            
        start_ts = int(current_dt.timestamp())

        logger.info(f"--- Скачивание логов за {day_str} ---")

        # 3. Запускаем опрос всех камер ПАРАЛЛЕЛЬНО
        tasks = [
            process_camera_for_day(cam, start_ts, end_ts, day_start_str, day_end_str)
            for cam in cameras_to_process
        ]
        await asyncio.gather(*tasks)

        days_processed.append(day_str)
        # Переходим к следующему дню
        current_dt += timedelta(days=1)

    # 4. Проставляем отсутствующих только после завершения всех загрузок
    logger.info("=== Загрузка с камер завершена. Начинаем поиск отсутствующих за эти дни ===")
    for day_str in days_processed:
        created_absent = await mark_absentees(day_str)
        logger.info(f"  [{day_str}] Проставлен статус absent для {created_absent} сотрудников.")

    logger.info("=== Загрузка истории успешно завершена ===")

if __name__ == "__main__":
    asyncio.run(main())
