from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_session, require_permission
from app.models.attendances import Attendance
from app.models.work_schedule import WorkSchedule
from app.schemas.work_schedule import (
    RecomputeResult,
    WorkScheduleRead,
    WorkScheduleUpdate,
)
from app.services.attendance_status import compute_status

router = APIRouter(prefix="/settings/work-schedule", tags=["settings"])


async def _get_schedule(session: AsyncSession) -> WorkSchedule:
    result = await session.execute(select(WorkSchedule).where(WorkSchedule.id == 1))
    schedule = result.scalar_one_or_none()
    if schedule is None:
        raise HTTPException(status_code=500, detail="Work schedule singleton missing — run migrations")
    return schedule


@router.get(
    "/",
    response_model=WorkScheduleRead,
    dependencies=[Depends(require_permission("work_schedules:read"))],
)
async def get_work_schedule(
    session: AsyncSession = Depends(get_session),
) -> WorkSchedule:
    return await _get_schedule(session)


@router.patch(
    "/",
    response_model=WorkScheduleRead,
    dependencies=[Depends(require_permission("work_schedules:write"))],
)
async def update_work_schedule(
    data: WorkScheduleUpdate,
    session: AsyncSession = Depends(get_session),
) -> WorkSchedule:
    schedule = await _get_schedule(session)
    patch = data.model_dump(exclude_unset=True)
    for field, value in patch.items():
        setattr(schedule, field, value)
    if schedule.end_time <= schedule.start_time:
        raise HTTPException(status_code=422, detail="end_time must be after start_time")
    await session.commit()
    await session.refresh(schedule)
    return schedule


@router.post(
    "/recompute",
    response_model=RecomputeResult,
    dependencies=[Depends(require_permission("work_schedules:write"))],
)
async def recompute_statuses(
    session: AsyncSession = Depends(get_session),
) -> RecomputeResult:
    schedule = await _get_schedule(session)
    result = await session.execute(select(Attendance))
    attendances = list(result.scalars().all())

    updated = 0
    for att in attendances:
        new_status = compute_status(att.enter_time, att.exit_time, schedule)
        if att.status != new_status:
            att.status = new_status
            updated += 1

    await session.commit()
    return RecomputeResult(updated=updated)
