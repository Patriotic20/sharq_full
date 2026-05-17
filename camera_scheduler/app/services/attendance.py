from datetime import date, datetime, timedelta, timezone

from sqlalchemy import and_, or_, select

from app.core.database import db_helper
from app.enums.attendance import AttendanceStatus, PresenceStatus
from app.models.attendances import Attendance
from app.models.employees import Employee
from app.models.work_schedule import WorkSchedule
from app.services.attendance_status import compute_status

TZ = timezone(timedelta(hours=5))
STATUS_OK = 1


def _compute_presence(att: "Attendance") -> PresenceStatus | None:
    has_enter = att.enter_time is not None
    has_exit = att.exit_time is not None
    if has_enter and has_exit:
        return PresenceStatus.COMPLETE
    if has_enter:
        return PresenceStatus.NO_EXIT
    if has_exit:
        return PresenceStatus.NO_ENTRY
    return None


def _camera_type(camera) -> str:
    t = camera["type"]
    return t.value if hasattr(t, "value") else str(t)


def _parse_full_name(full_name: str) -> tuple[str, str, str]:
    """`Last First Middle ...` → (last, first, middle)."""
    parts = full_name.strip().split(maxsplit=2)
    last = parts[0] if len(parts) >= 1 else ""
    first = parts[1] if len(parts) >= 2 else ""
    middle = parts[2] if len(parts) >= 3 else ""
    return last, first, middle


def _apply_pass(att: Attendance, type_str: str, camera_id: int, rec_no: int, ts: datetime) -> bool:
    """
    Записать проход в attendance. Возвращает True, если поле обновлено
    (новый вход — самый ранний; новый выход — самый поздний).
    """
    if type_str == "enter":
        if att.enter_time is None or ts < att.enter_time:
            # Сбросить ошибочный (вчерашний) выход, если он оказался раньше нового входа
            if att.exit_time is not None and ts >= att.exit_time:
                att.exit_time = None
                att.exit_camera_id = None
                att.exit_rec_no = None

            att.enter_camera_id = camera_id
            att.enter_time = ts
            att.enter_rec_no = rec_no
            return True
        return False

    if att.exit_time is None or ts > att.exit_time:
        # Игнорировать выход, если он зафиксирован раньше времени входа
        if att.enter_time is not None and ts <= att.enter_time:
            return False

        att.exit_camera_id = camera_id
        att.exit_time = ts
        att.exit_rec_no = rec_no
        return True
    return False


def _new_attendance(
    employee_id: int,
    type_str: str,
    camera_id: int,
    rec_no: int,
    ts: datetime,
    schedule: WorkSchedule,
) -> Attendance:
    att = Attendance(employee_id=employee_id, status=AttendanceStatus.PRESENT)
    _apply_pass(att, type_str, camera_id, rec_no, ts)
    att.presence_status = _compute_presence(att)
    att.status = compute_status(att.enter_time, att.exit_time, schedule)
    return att


def _day_bounds(d: date) -> tuple[datetime, datetime]:
    """Полуинтервал [00:00 d, 00:00 d+1) с TZ."""
    start = datetime(d.year, d.month, d.day, tzinfo=TZ)
    return start, start + timedelta(days=1)


async def save_attendance(records, camera):
    """
    Сохранить записи с одной камеры в таблицу `attendances`.

    Поток на каждую запись:
      1. Status == 1 и UserID присутствуют (иначе пропуск).
      2. Найти сотрудника по camera_user_id; если нет — создать из CardName.
      3. Дедуп по (camera_id, RecNo).
      4. Найти/создать строку attendance за этот день и обновить
         enter_* (самый ранний) или exit_* (самый поздний).
    """
    valid = [
        r for r in records
        if r.get("Status") == STATUS_OK and str(r.get("UserID") or "").strip()
    ]
    stats = {
        "saved": 0,
        "created_employees": 0,
        "skipped_dedup": 0,
    }
    if not valid:
        return stats

    type_str = _camera_type(camera)
    cam_id = camera["id"]
    user_ids = {str(r["UserID"]).strip() for r in valid}
    rec_nos = {r["RecNo"] for r in valid}

    async with db_helper.session_context() as session:
        # --- Read singleton work schedule once for the whole batch ---
        schedule = (await session.execute(
            select(WorkSchedule).where(WorkSchedule.id == 1)
        )).scalar_one()

        # --- Batch: подгружаем всех известных сотрудников одним запросом ---
        emp_rows = (await session.execute(
            select(Employee).where(Employee.camera_user_id.in_(user_ids))
        )).scalars().all()
        emp_by_user_id = {e.camera_user_id: e for e in emp_rows}

        # --- Batch: какие RecNo уже сохранены в БД для ЭТОЙ камеры ---
        seen_pairs = (await session.execute(
            select(Attendance.enter_rec_no, Attendance.exit_rec_no).where(
                or_(
                    and_(Attendance.enter_camera_id == cam_id,
                         Attendance.enter_rec_no.in_(rec_nos)),
                    and_(Attendance.exit_camera_id == cam_id,
                         Attendance.exit_rec_no.in_(rec_nos)),
                )
            )
        )).all()
        seen_rec_nos: set[int] = set()
        for enter_rn, exit_rn in seen_pairs:
            if enter_rn is not None:
                seen_rec_nos.add(enter_rn)
            if exit_rn is not None:
                seen_rec_nos.add(exit_rn)

        # --- Кеш строк attendance: (employee_id, date) → Attendance ---
        day_cache: dict[tuple[int, date], Attendance] = {}

        for rec in valid:
            rec_no = rec["RecNo"]
            if rec_no in seen_rec_nos:
                stats["skipped_dedup"] += 1
                continue

            user_id = str(rec["UserID"]).strip()
            ts = datetime.fromtimestamp(rec["CreateTime"], tz=TZ)

            emp = emp_by_user_id.get(user_id)
            if emp is None:
                full_name = (rec.get("CardName") or "").strip()
                if not full_name:
                    continue
                last, first, middle = _parse_full_name(full_name)
                emp = Employee(
                    first_name=first,
                    last_name=last,
                    middle_name=middle,
                    camera_user_id=user_id,
                )
                session.add(emp)
                await session.flush()
                emp_by_user_id[user_id] = emp
                stats["created_employees"] += 1

            day = ts.date()
            day_start, day_end = _day_bounds(day)

            cache_key = (emp.id, day)
            att = day_cache.get(cache_key)
            if att is None:
                att = (await session.execute(
                    select(Attendance).where(
                        Attendance.employee_id == emp.id,
                        or_(
                            and_(Attendance.enter_time >= day_start,
                                 Attendance.enter_time < day_end),
                            and_(Attendance.exit_time >= day_start,
                                 Attendance.exit_time < day_end),
                        ),
                    )
                )).scalar_one_or_none()

            if att is None:
                att = _new_attendance(emp.id, type_str, cam_id, rec_no, ts, schedule)
                session.add(att)
                day_cache[cache_key] = att
                seen_rec_nos.add(rec_no)
                stats["saved"] += 1
                continue

            day_cache[cache_key] = att
            if _apply_pass(att, type_str, cam_id, rec_no, ts):
                att.presence_status = _compute_presence(att)
                att.status = compute_status(att.enter_time, att.exit_time, schedule)
                seen_rec_nos.add(rec_no)
                stats["saved"] += 1

        await session.commit()

    return stats


async def mark_absentees(day_str: str) -> int:
    """
    Создать строку attendance с presence_status='absent' для каждого
    сотрудника, у которого нет записи за указанный день.

    day_str: строка вида 'YYYY-MM-DD'.
    """
    day = datetime.strptime(day_str, "%Y-%m-%d").date()
    day_start, day_end = _day_bounds(day)

    async with db_helper.session_context() as session:
        all_emp_ids = set(
            (await session.execute(select(Employee.id))).scalars().all()
        )

        present_ids = set(
            (await session.execute(
                select(Attendance.employee_id).where(
                    or_(
                        and_(Attendance.enter_time >= day_start,
                             Attendance.enter_time < day_end),
                        and_(Attendance.exit_time >= day_start,
                             Attendance.exit_time < day_end),
                    )
                )
            )).scalars().all()
        )

        missing = all_emp_ids - present_ids
        if not missing:
            return 0

        for emp_id in missing:
            session.add(Attendance(
                employee_id=emp_id,
                status=AttendanceStatus.ABSENT,
                presence_status=None,
            ))

        await session.commit()

    return len(missing)
