from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_session, require_permission
from app.exceptions.department import DepartmentNotFoundException
from app.exceptions.employee import EmployeeNotFoundException
from app.exceptions.employe_info import (
    DatabaseException,
    EmployeeInfoAlreadyExistsException,
    EmployeeInfoNotFoundException,
)
from app.exceptions.position import PositionNotFoundException
from app.repositories.department import DepartmentRepository
from app.repositories.employee import EmployeeRepository
from app.repositories.employe_info import EmployeeInfoRepository
from app.repositories.position import PositionRepository
from app.schemas.common import PaginationParams
from app.schemas.employe_info import (
    EmployeeInfoCreate,
    EmployeeInfoListResponse,
    EmployeeInfoRead,
    EmployeeInfoSearchParams,
    EmployeeInfoUpdate,
)
from app.services.employe_info import EmployeeInfoService

router = APIRouter(prefix="/employe-info", tags=["employe-info"])


def get_employee_info_service(
    session: AsyncSession = Depends(get_session),
) -> EmployeeInfoService:
    return EmployeeInfoService(
        EmployeeInfoRepository(session),
        EmployeeRepository(session),
        DepartmentRepository(session),
        PositionRepository(session),
    )


def _handle(
    exc: EmployeeInfoNotFoundException
    | EmployeeInfoAlreadyExistsException
    | EmployeeNotFoundException
    | DepartmentNotFoundException
    | PositionNotFoundException
    | DatabaseException,
) -> None:
    raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.get(
    "/",
    response_model=EmployeeInfoListResponse,
    dependencies=[Depends(require_permission("employe_info:read"))],
)
async def list_employee_info(
    page: int = 1,
    size: int = 10,
    full_name: str | None = None,
    department_id: int | None = None,
    employee_id: int | None = None,
    order: Literal["asc", "desc"] = "desc",
    service: EmployeeInfoService = Depends(get_employee_info_service),
) -> EmployeeInfoListResponse:
    pagination = PaginationParams(page=page, size=size)
    search = EmployeeInfoSearchParams(
        full_name=full_name,
        department_id=department_id,
        employee_id=employee_id,
        order=order,
    )
    return await service.list(pagination, search)


@router.post(
    "/",
    response_model=EmployeeInfoRead,
    status_code=201,
    dependencies=[Depends(require_permission("employe_info:write"))],
)
async def create_employee_info(
    data: EmployeeInfoCreate,
    service: EmployeeInfoService = Depends(get_employee_info_service),
) -> EmployeeInfoRead:
    try:
        return await service.create(data)
    except (
        EmployeeNotFoundException,
        DepartmentNotFoundException,
        PositionNotFoundException,
        EmployeeInfoAlreadyExistsException,
        DatabaseException,
    ) as e:
        _handle(e)


@router.get(
    "/{info_id}",
    response_model=EmployeeInfoRead,
    dependencies=[Depends(require_permission("employe_info:read"))],
)
async def get_employee_info(
    info_id: int,
    service: EmployeeInfoService = Depends(get_employee_info_service),
) -> EmployeeInfoRead:
    try:
        return await service.get(info_id)
    except EmployeeInfoNotFoundException as e:
        _handle(e)


@router.patch(
    "/{info_id}",
    response_model=EmployeeInfoRead,
    dependencies=[Depends(require_permission("employe_info:update"))],
)
async def update_employee_info(
    info_id: int,
    data: EmployeeInfoUpdate,
    service: EmployeeInfoService = Depends(get_employee_info_service),
) -> EmployeeInfoRead:
    try:
        return await service.update(info_id, data)
    except (
        EmployeeInfoNotFoundException,
        DepartmentNotFoundException,
        PositionNotFoundException,
        DatabaseException,
    ) as e:
        _handle(e)


@router.delete(
    "/{info_id}",
    status_code=204,
    dependencies=[Depends(require_permission("employe_info:delete"))],
)
async def delete_employee_info(
    info_id: int,
    service: EmployeeInfoService = Depends(get_employee_info_service),
) -> None:
    try:
        await service.delete(info_id)
    except (EmployeeInfoNotFoundException, DatabaseException) as e:
        _handle(e)
