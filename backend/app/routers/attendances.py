from datetime import date as DateType

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_session, require_permission
from app.enums.attendance import AttendanceStatus, PresenceStatus
from app.exceptions.attendance import AttendanceNotFoundException, DatabaseException
from app.repositories.attendance import AttendanceRepository
from app.schemas.attendance import (
    AttendanceFilterParams,
    AttendanceListResponse,
    AttendanceRead,
    AttendanceUpdate,
    PaginationParams,
)
from app.services.attendance import AttendanceService

router = APIRouter(prefix="/attendances", tags=["attendances"])


def get_attendance_service(
    session: AsyncSession = Depends(get_session),
) -> AttendanceService:
    return AttendanceService(AttendanceRepository(session))


def _handle(exc: AttendanceNotFoundException | DatabaseException) -> None:
    raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.get(
    "/",
    response_model=AttendanceListResponse,
    dependencies=[Depends(require_permission("attendances:read"))],
)
async def list_attendances(
    page: int = 1,
    size: int = 10,
    filter_date: DateType | None = Query(default=None, alias="date"),
    employee_id: int | None = None,
    status: AttendanceStatus | None = None,
    presence_status: PresenceStatus | None = None,
    service: AttendanceService = Depends(get_attendance_service),
) -> AttendanceListResponse:
    pagination = PaginationParams(page=page, size=size)
    filters = AttendanceFilterParams(
        date=filter_date,
        employee_id=employee_id,
        status=status,
        presence_status=presence_status,
    )
    return await service.list(pagination, filters)


@router.get(
    "/{attendance_id}",
    response_model=AttendanceRead,
    dependencies=[Depends(require_permission("attendances:read"))],
)
async def get_attendance(
    attendance_id: int,
    service: AttendanceService = Depends(get_attendance_service),
) -> AttendanceRead:
    try:
        return await service.get(attendance_id)
    except AttendanceNotFoundException as e:
        _handle(e)


@router.patch(
    "/{attendance_id}",
    response_model=AttendanceRead,
    dependencies=[Depends(require_permission("attendances:update"))],
)
async def update_attendance(
    attendance_id: int,
    data: AttendanceUpdate,
    service: AttendanceService = Depends(get_attendance_service),
) -> AttendanceRead:
    try:
        return await service.update(attendance_id, data)
    except (AttendanceNotFoundException, DatabaseException) as e:
        _handle(e)


@router.delete(
    "/{attendance_id}",
    status_code=204,
    dependencies=[Depends(require_permission("attendances:delete"))],
)
async def delete_attendance(
    attendance_id: int,
    service: AttendanceService = Depends(get_attendance_service),
) -> None:
    try:
        await service.delete(attendance_id)
    except (AttendanceNotFoundException, DatabaseException) as e:
        _handle(e)
