from datetime import datetime, time, timedelta

from app.enums.attendance import AttendanceStatus
from app.models.work_schedule import WorkSchedule


def compute_status(
    enter_time: datetime | None,
    exit_time: datetime | None,
    schedule: WorkSchedule,
) -> AttendanceStatus:
    if enter_time is None and exit_time is None:
        return AttendanceStatus.ABSENT

    if enter_time is not None:
        late_cutoff = _combine(enter_time, schedule.start_time) + timedelta(
            minutes=schedule.late_threshold_minutes
        )
        if enter_time > late_cutoff:
            return AttendanceStatus.LATE  # priority over LEFT_EARLY

    if exit_time is not None:
        early_cutoff = _combine(exit_time, schedule.end_time) - timedelta(
            minutes=schedule.early_leave_threshold_minutes
        )
        if exit_time < early_cutoff:
            return AttendanceStatus.LEFT_EARLY

    return AttendanceStatus.PRESENT


def _combine(dt: datetime, t: time) -> datetime:
    return dt.replace(hour=t.hour, minute=t.minute, second=t.second, microsecond=0)
