from collections.abc import Iterable
from datetime import date, datetime, timedelta

from sqlalchemy import and_, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.core.database import db_helper
from app.core.timezone import APP_TZ
from app.enums.attendance import AttendanceStatus, PresenceStatus
from app.enums.camera import CameraType
from app.models.attendance_event import AttendanceEvent
from app.models.attendances import Attendance
from app.models.employe_info import EmployeeInfo
from app.models.employees import Employee
from app.models.work_schedule import WorkSchedule
from app.services.attendance_status import compute_status
from app.services.schedule_resolver import resolve_schedule

TZ = APP_TZ
STATUS_OK = 1


def _camera_type(camera) -> str:
    t = camera["type"]
    return t.value if hasattr(t, "value") else str(t)


def _parse_full_name(full_name: str) -> tuple[str, str, str]:
    parts = full_name.strip().split(maxsplit=2)
    last = parts[0] if len(parts) >= 1 else ""
    first = parts[1] if len(parts) >= 2 else ""
    middle = parts[2] if len(parts) >= 3 else ""
    return last, first, middle


def _day_bounds(d: date) -> tuple[datetime, datetime]:
    start = datetime(d.year, d.month, d.day, tzinfo=TZ)
    return start, start + timedelta(days=1)


def _compute_presence(
    enter_time: datetime | None, exit_time: datetime | None
) -> PresenceStatus | None:
    if enter_time is not None and exit_time is not None:
        return PresenceStatus.COMPLETE
    if enter_time is not None:
        return PresenceStatus.NO_EXIT
    if exit_time is not None:
        return PresenceStatus.NO_ENTRY
    return None


def _compute_worked_seconds(events: Iterable[AttendanceEvent]) -> int:
    total = 0
    pending: datetime | None = None
    for ev in events:
        if ev.type == CameraType.ENTER:
            if pending is None:
                pending = ev.event_time
        else:
            if pending is not None:
                delta = (ev.event_time - pending).total_seconds()
                if delta > 0:
                    total += int(delta)
                pending = None
    return max(0, total)


def _recompute_summary(
    att: Attendance,
    events: list[AttendanceEvent],
    schedule: WorkSchedule | None,
) -> None:
    """Recalculate enter/exit/worked/status from chronologically sorted events."""
    first_enter: AttendanceEvent | None = None
    last_exit: AttendanceEvent | None = None
    for ev in events:
        if ev.type == CameraType.ENTER:
            if first_enter is None or ev.event_time < first_enter.event_time:
                first_enter = ev
        else:
            if last_exit is None or ev.event_time > last_exit.event_time:
                last_exit = ev

    att.enter_time = first_enter.event_time if first_enter else None
    att.enter_camera_id = first_enter.camera_id if first_enter else None
    att.enter_rec_no = first_enter.rec_no if first_enter else None
    att.exit_time = last_exit.event_time if last_exit else None
    att.exit_camera_id = last_exit.camera_id if last_exit else None
    att.exit_rec_no = last_exit.rec_no if last_exit else None
    att.worked_seconds = _compute_worked_seconds(events)
    att.presence_status = _compute_presence(att.enter_time, att.exit_time)
    if schedule is not None and (att.enter_time or att.exit_time):
        att.status = compute_status(att.enter_time, att.exit_time, schedule)


async def save_attendance(records, camera):
    """Сохранить записи с одной камеры.

    Поток на каждую запись:
      1. Status == 1 и UserID присутствуют (иначе пропуск).
      2. Найти сотрудника по camera_user_id; если нет — создать из CardName.
      3. Дедуп по (camera_id, RecNo) на уровне attendance_events.
      4. Найти/создать строку attendance за этот день.
      5. Добавить AttendanceEvent.
      6. Пересчитать summary (enter_time, exit_time, worked_seconds, status, presence).
    """
    valid = [
        r for r in records
        if r.get("Status") == STATUS_OK and str(r.get("UserID") or "").strip()
    ]
    stats = {"saved": 0, "created_employees": 0, "skipped_dedup": 0}
    if not valid:
        return stats

    type_str = _camera_type(camera)
    cam_id = camera["id"]
    user_ids = {str(r["UserID"]).strip() for r in valid}
    rec_nos = {r["RecNo"] for r in valid}

    async with db_helper.session_context() as session:
        schedule_by_dept: dict[int | None, WorkSchedule | None] = {}

        async def _schedule_for(emp: Employee) -> WorkSchedule | None:
            dept_id = emp.department_id
            if dept_id not in schedule_by_dept:
                schedule_by_dept[dept_id] = await resolve_schedule(session, dept_id)
            return schedule_by_dept[dept_id]

        emp_rows = (await session.execute(
            select(Employee).where(Employee.camera_user_id.in_(user_ids))
        )).scalars().all()
        emp_by_user_id = {e.camera_user_id: e for e in emp_rows}

        # Dedup: which RecNos for this camera are already in attendance_events.
        seen_recs = (await session.execute(
            select(AttendanceEvent.rec_no).where(
                AttendanceEvent.camera_id == cam_id,
                AttendanceEvent.rec_no.in_(rec_nos),
            )
        )).scalars().all()
        seen_rec_nos: set[int] = set(seen_recs)

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
                session.add(EmployeeInfo(employee_id=emp.id, full_name=full_name))
                await session.flush()
                emp_by_user_id[user_id] = emp
                stats["created_employees"] += 1

            day = ts.date()
            day_start, day_end = _day_bounds(day)
            cache_key = (emp.id, day)

            att = day_cache.get(cache_key)
            if att is None:
                att = (await session.execute(
                    select(Attendance)
                    .options(selectinload(Attendance.events))
                    .where(
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
                att = Attendance(
                    employee_id=emp.id,
                    status=AttendanceStatus.PRESENT,
                )
                session.add(att)
                await session.flush()
                day_cache[cache_key] = att

            day_cache[cache_key] = att

            event = AttendanceEvent(
                attendance_id=att.id,
                type=CameraType(type_str),
                event_time=ts,
                camera_id=cam_id,
                rec_no=rec_no,
            )
            session.add(event)
            try:
                await session.flush()
            except IntegrityError:
                # Concurrent insert raced us (camera_id, rec_no) — skip.
                await session.rollback()
                seen_rec_nos.add(rec_no)
                stats["skipped_dedup"] += 1
                # Rollback drops all in-flight changes; re-fetch from DB on next iteration.
                day_cache.clear()
                continue

            # Rebuild the in-memory event list (existing + the new one) for recompute.
            # att.events is populated lazily; reload to ensure ordering.
            await session.refresh(att, attribute_names=["events"])
            schedule = await _schedule_for(emp)
            _recompute_summary(att, list(att.events), schedule)

            seen_rec_nos.add(rec_no)
            stats["saved"] += 1

        await session.commit()

    return stats


async def mark_absentees(day_str: str) -> int:
    """Create absent rows for employees with no attendance on the given day."""
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
