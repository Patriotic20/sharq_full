from sqlalchemy import select

from app.exceptions.attendance import AttendanceNotFoundException
from app.models.work_schedule import WorkSchedule
from app.repositories.attendance import AttendanceRepository
from app.schemas.attendance import (
    AttendanceFilterParams,
    AttendanceListResponse,
    AttendanceRead,
    AttendanceUpdate,
    PaginationParams,
)
from app.services.attendance_status import compute_status


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
        # If times changed and client didn't send a status override, recompute it.
        times_changed = "enter_time" in patch or "exit_time" in patch
        if times_changed and "status" not in patch:
            schedule = (await self.repo.session.execute(
                select(WorkSchedule).where(WorkSchedule.id == 1)
            )).scalar_one()
            new_enter = patch.get("enter_time", attendance.enter_time)
            new_exit = patch.get("exit_time", attendance.exit_time)
            data = data.model_copy(update={"status": compute_status(new_enter, new_exit, schedule)})

        attendance = await self.repo.update(attendance, data)
        return AttendanceRead.model_validate(attendance)

    async def delete(self, attendance_id: int) -> None:
        attendance = await self.repo.get_by_id(attendance_id)
        if not attendance:
            raise AttendanceNotFoundException()
        await self.repo.delete(attendance)
