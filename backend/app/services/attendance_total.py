from collections.abc import Iterable
from datetime import datetime

from app.enums.camera import CameraType
from app.models.attendance_event import AttendanceEvent


def compute_worked_seconds(events: Iterable[AttendanceEvent]) -> int:
    """Sum of paired enter→exit intervals in chronological order.

    Pairs first unmatched enter with the next exit, then the next enter with the
    following exit, and so on. Unmatched events are ignored. Callers must pass
    events sorted by event_time ascending.
    """
    total = 0
    pending_enter: datetime | None = None
    for ev in events:
        if ev.type == CameraType.ENTER:
            if pending_enter is None:
                pending_enter = ev.event_time
            # Повторный enter без exit — оставляем первый, не сбрасываем.
        else:  # EXIT
            if pending_enter is not None:
                delta = (ev.event_time - pending_enter).total_seconds()
                if delta > 0:
                    total += int(delta)
                pending_enter = None
            # exit без открытого enter — игнорируем.
    return max(0, total)


def summary_from_events(
    events: list[AttendanceEvent],
) -> tuple[datetime | None, int | None, int | None, datetime | None, int | None, int | None, int]:
    """Compute summary fields from a chronologically-sorted event list.

    Returns:
        (enter_time, enter_camera_id, enter_rec_no,
         exit_time, exit_camera_id, exit_rec_no,
         worked_seconds)
    """
    first_enter: AttendanceEvent | None = None
    last_exit: AttendanceEvent | None = None
    for ev in events:
        if ev.type == CameraType.ENTER:
            if first_enter is None or ev.event_time < first_enter.event_time:
                first_enter = ev
        else:
            if last_exit is None or ev.event_time > last_exit.event_time:
                last_exit = ev
    worked = compute_worked_seconds(events)
    return (
        first_enter.event_time if first_enter else None,
        first_enter.camera_id if first_enter else None,
        first_enter.rec_no if first_enter else None,
        last_exit.event_time if last_exit else None,
        last_exit.camera_id if last_exit else None,
        last_exit.rec_no if last_exit else None,
        worked,
    )
