from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_session, require_permission
from app.exceptions.department import DepartmentNotFoundException
from app.exceptions.group import GroupNotFoundException
from app.exceptions.work_schedule import (
    CannotDeleteDefaultScheduleException,
    DefaultWorkScheduleConflictException,
    DepartmentAlreadyAssignedException,
    GroupAlreadyAssignedException,
    WorkScheduleAlreadyExistsException,
    WorkScheduleDatabaseException,
    WorkScheduleNotFoundException,
)
from app.models.attendance_event import AttendanceEvent
from app.models.attendances import Attendance
from app.models.employees import Employee
from app.repositories.work_schedule import WorkScheduleRepository
from app.schemas.common import PaginationParams
from app.schemas.work_schedule import (
    RecomputeResult,
    WorkScheduleCreate,
    WorkScheduleListResponse,
    WorkScheduleRead,
    WorkScheduleSearchParams,
    WorkScheduleUpdate,
)
from app.services.attendance_status import compute_status
from app.services.attendance_total import summary_from_events
from app.services.work_schedule import WorkScheduleService

router = APIRouter(prefix="/settings/work-schedules", tags=["settings"])


def get_work_schedule_service(
    session: AsyncSession = Depends(get_session),
) -> WorkScheduleService:
    return WorkScheduleService(WorkScheduleRepository(session))


_ServiceError = (
    WorkScheduleNotFoundException
    | WorkScheduleAlreadyExistsException
    | DefaultWorkScheduleConflictException
    | DepartmentAlreadyAssignedException
    | GroupAlreadyAssignedException
    | CannotDeleteDefaultScheduleException
    | DepartmentNotFoundException
    | GroupNotFoundException
    | WorkScheduleDatabaseException
)


def _handle(exc: _ServiceError) -> None:
    raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.post(
    "/",
    response_model=WorkScheduleRead,
    status_code=201,
    dependencies=[Depends(require_permission("work_schedules:write"))],
)
async def create_work_schedule(
    data: WorkScheduleCreate,
    service: WorkScheduleService = Depends(get_work_schedule_service),
) -> WorkScheduleRead:
    try:
        return await service.create(data)
    except (
        WorkScheduleAlreadyExistsException,
        DefaultWorkScheduleConflictException,
        DepartmentAlreadyAssignedException,
        GroupAlreadyAssignedException,
        DepartmentNotFoundException,
        GroupNotFoundException,
        WorkScheduleDatabaseException,
    ) as e:
        _handle(e)


@router.get(
    "/",
    response_model=WorkScheduleListResponse,
    dependencies=[Depends(require_permission("work_schedules:read"))],
)
async def list_work_schedules(
    page: int = 1,
    size: int = 10,
    name: str | None = None,
    order: Literal["asc", "desc"] = "desc",
    service: WorkScheduleService = Depends(get_work_schedule_service),
) -> WorkScheduleListResponse:
    pagination = PaginationParams(page=page, size=size)
    search = WorkScheduleSearchParams(name=name, order=order)
    return await service.list(pagination, search)


@router.get(
    "/{schedule_id}",
    response_model=WorkScheduleRead,
    dependencies=[Depends(require_permission("work_schedules:read"))],
)
async def get_work_schedule(
    schedule_id: int,
    service: WorkScheduleService = Depends(get_work_schedule_service),
) -> WorkScheduleRead:
    try:
        return await service.get(schedule_id)
    except WorkScheduleNotFoundException as e:
        _handle(e)


@router.patch(
    "/{schedule_id}",
    response_model=WorkScheduleRead,
    dependencies=[Depends(require_permission("work_schedules:update"))],
)
async def update_work_schedule(
    schedule_id: int,
    data: WorkScheduleUpdate,
    service: WorkScheduleService = Depends(get_work_schedule_service),
) -> WorkScheduleRead:
    try:
        return await service.update(schedule_id, data)
    except (
        WorkScheduleNotFoundException,
        WorkScheduleAlreadyExistsException,
        DefaultWorkScheduleConflictException,
        DepartmentAlreadyAssignedException,
        GroupAlreadyAssignedException,
        DepartmentNotFoundException,
        GroupNotFoundException,
        WorkScheduleDatabaseException,
    ) as e:
        _handle(e)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.delete(
    "/{schedule_id}",
    status_code=204,
    dependencies=[Depends(require_permission("work_schedules:delete"))],
)
async def delete_work_schedule(
    schedule_id: int,
    service: WorkScheduleService = Depends(get_work_schedule_service),
) -> None:
    try:
        await service.delete(schedule_id)
    except (
        WorkScheduleNotFoundException,
        CannotDeleteDefaultScheduleException,
        WorkScheduleDatabaseException,
    ) as e:
        _handle(e)


@router.post(
    "/recompute",
    response_model=RecomputeResult,
    dependencies=[Depends(require_permission("work_schedules:update"))],
)
async def recompute_statuses(
    session: AsyncSession = Depends(get_session),
) -> RecomputeResult:
    service = WorkScheduleService(WorkScheduleRepository(session))
    result = await session.execute(
        select(Attendance).options(
            selectinload(Attendance.employee).selectinload(Employee.department),
            selectinload(Attendance.events).joinedload(AttendanceEvent.camera),
        )
    )
    attendances = list(result.scalars().all())

    updated = 0
    schedule_cache: dict[int | None, "object | None"] = {}
    for att in attendances:
        emp = att.employee
        if emp is None:
            continue

        # 1. Re-derive summary fields from the event timeline (if any events).
        if att.events:
            (
                enter_time,
                enter_camera_id,
                enter_rec_no,
                exit_time,
                exit_camera_id,
                exit_rec_no,
                worked,
            ) = summary_from_events(att.events)
            changed = False
            if att.enter_time != enter_time:
                att.enter_time = enter_time
                changed = True
            if att.enter_camera_id != enter_camera_id:
                att.enter_camera_id = enter_camera_id
                changed = True
            if att.enter_rec_no != enter_rec_no:
                att.enter_rec_no = enter_rec_no
                changed = True
            if att.exit_time != exit_time:
                att.exit_time = exit_time
                changed = True
            if att.exit_camera_id != exit_camera_id:
                att.exit_camera_id = exit_camera_id
                changed = True
            if att.exit_rec_no != exit_rec_no:
                att.exit_rec_no = exit_rec_no
                changed = True
            if att.worked_seconds != worked:
                att.worked_seconds = worked
                changed = True
            if changed:
                updated += 1

        # 2. Re-derive status from resolved schedule (if available).
        dept_id = emp.department_id
        if dept_id in schedule_cache:
            schedule = schedule_cache[dept_id]
        else:
            schedule = await service.resolve_for_employee(emp)
            schedule_cache[dept_id] = schedule
        if schedule is None:
            continue
        new_status = compute_status(att.enter_time, att.exit_time, schedule)
        if att.status != new_status:
            att.status = new_status
            updated += 1

    await session.commit()
    return RecomputeResult(updated=updated)
