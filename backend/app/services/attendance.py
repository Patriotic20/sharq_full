from datetime import datetime, time

from sqlalchemy import select

from app.core.timezone import APP_TZ
from app.exceptions.attendance import (
    AttendanceConflictException,
    AttendanceNotFoundException,
    DatabaseException,
)
from app.models.attendances import Attendance
from app.repositories.attendance import AttendanceRepository
from app.repositories.work_schedule import WorkScheduleRepository
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceFilterParams,
    AttendanceListResponse,
    AttendanceRead,
    AttendanceUpdate,
    PaginationParams,
)
from app.services.attendance_status import compute_status
from app.services.work_schedule import WorkScheduleService


class AttendanceService:
    def __init__(self, repo: AttendanceRepository) -> None:
        self.repo = repo

    async def list(
        self,
        pagination: PaginationParams,
        filters: AttendanceFilterParams,
    ) -> AttendanceListResponse:
        items, total = await self.repo.list(
            limit=pagination.limit,
            offset=pagination.offset,
            date=filters.date,
            employee_id=filters.employee_id,
            status=filters.status,
            presence_status=filters.presence_status,
            date_from=filters.date_from,
            date_to=filters.date_to,
        )
        return AttendanceListResponse.build(
            items=[AttendanceRead.model_validate(a) for a in items],
            total=total,
            pagination=pagination,
        )

    async def get(self, attendance_id: int) -> AttendanceRead:
        attendance = await self.repo.get_by_id(attendance_id)
        if not attendance:
            raise AttendanceNotFoundException()
        return AttendanceRead.model_validate(attendance)

    async def update(self, attendance_id: int, data: AttendanceUpdate) -> AttendanceRead:
        attendance = await self.repo.get_by_id(attendance_id)
        if not attendance:
            raise AttendanceNotFoundException()

        patch = data.model_dump(exclude_unset=True)
        times_changed = "enter_time" in patch or "exit_time" in patch
        new_enter = patch.get("enter_time", attendance.enter_time)
        new_exit = patch.get("exit_time", attendance.exit_time)

        if times_changed and "status" not in patch:
            schedule_service = WorkScheduleService(
                WorkScheduleRepository(self.repo.session)
            )
            schedule = await schedule_service.resolve_for_employee(attendance.employee)
            if schedule is not None:
                data = data.model_copy(
                    update={"status": compute_status(new_enter, new_exit, schedule)}
                )

        attendance = await self.repo.update(attendance, data)

        if times_changed:
            # Manual edits to summary times are decoupled from the event timeline;
            # keep worked_seconds in sync with what's displayed (single closed pair).
            if new_enter and new_exit and new_exit > new_enter:
                worked = int((new_exit - new_enter).total_seconds())
            else:
                worked = 0
            if attendance.worked_seconds != worked:
                attendance.worked_seconds = worked
                await self.repo.session.commit()
                attendance = await self.repo.get_by_id(attendance.id)

        return AttendanceRead.model_validate(attendance)

    async def create(self, data: AttendanceCreate) -> AttendanceRead:
        # Anchor the row to its date at 12:00 local time so existing
        # `func.date(timezone(...))` queries pick it up consistently.
        anchor_dt = datetime.combine(data.date, time(12, 0), tzinfo=APP_TZ)

        # Reject if a record for the same employee+date already exists.
        from sqlalchemy import func as sa_func
        from app.core.timezone import APP_TZ_NAME

        existing = await self.repo.session.execute(
            select(Attendance.id).where(
                Attendance.employee_id == data.employee_id,
                sa_func.date(sa_func.timezone(APP_TZ_NAME, Attendance.enter_time)) == data.date,
            )
        )
        if existing.scalar_one_or_none() is not None:
            raise AttendanceConflictException()

        row = Attendance(
            employee_id=data.employee_id,
            enter_time=anchor_dt,
            status=data.status,
            leave_type=data.leave_type,
            worked_seconds=0,
        )
        self.repo.session.add(row)
        try:
            await self.repo.session.commit()
        except Exception:
            await self.repo.session.rollback()
            raise DatabaseException()

        fresh = await self.repo.get_by_id(row.id)
        return AttendanceRead.model_validate(fresh)

    async def delete(self, attendance_id: int) -> None:
        attendance = await self.repo.get_by_id(attendance_id)
        if not attendance:
            raise AttendanceNotFoundException()
        await self.repo.delete(attendance)
