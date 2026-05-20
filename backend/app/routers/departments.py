from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_session, require_permission
from app.exceptions.department import (
    DatabaseException,
    DepartmentAlreadyExistsException,
    DepartmentNotFoundException,
)
from app.repositories.department import DepartmentRepository
from app.repositories.employee import EmployeeRepository
from app.schemas.common import PaginationParams
from app.schemas.department import (
    DepartmentCreate,
    DepartmentListResponse,
    DepartmentRead,
    DepartmentSearchParams,
    DepartmentUpdate,
)
from app.schemas.employee import EmployeeListResponse
from app.schemas.employee import EmployeeSearchParams as _EmployeeSearchParams
from app.schemas.employee import PaginationParams as EmployeePaginationParams
from app.services.department import DepartmentService
from app.services.employee import EmployeeService

router = APIRouter(prefix="/departments", tags=["departments"])


def get_department_service(
    session: AsyncSession = Depends(get_session),
) -> DepartmentService:
    return DepartmentService(DepartmentRepository(session))


def get_employee_service(
    session: AsyncSession = Depends(get_session),
) -> EmployeeService:
    return EmployeeService(
        EmployeeRepository(session),
        DepartmentRepository(session),
    )


def _handle(
    exc: DepartmentNotFoundException
    | DepartmentAlreadyExistsException
    | DatabaseException,
) -> None:
    raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.post(
    "/",
    response_model=DepartmentRead,
    status_code=201,
    dependencies=[Depends(require_permission("departments:write"))],
)
async def create_department(
    data: DepartmentCreate,
    service: DepartmentService = Depends(get_department_service),
) -> DepartmentRead:
    try:
        return await service.create(data)
    except (DepartmentAlreadyExistsException, DatabaseException) as e:
        _handle(e)


@router.get(
    "/",
    response_model=DepartmentListResponse,
    dependencies=[Depends(require_permission("departments:read"))],
)
async def list_departments(
    page: int = 1,
    size: int = 10,
    name: str | None = None,
    order: Literal["asc", "desc"] = "desc",
    service: DepartmentService = Depends(get_department_service),
) -> DepartmentListResponse:
    pagination = PaginationParams(page=page, size=size)
    search = DepartmentSearchParams(name=name, order=order)
    return await service.list(pagination, search)


@router.get(
    "/{department_id}",
    response_model=DepartmentRead,
    dependencies=[Depends(require_permission("departments:read"))],
)
async def get_department(
    department_id: int,
    service: DepartmentService = Depends(get_department_service),
) -> DepartmentRead:
    try:
        return await service.get(department_id)
    except DepartmentNotFoundException as e:
        _handle(e)


@router.get(
    "/{department_id}/employees",
    response_model=EmployeeListResponse,
    dependencies=[Depends(require_permission("departments:read"))],
)
async def list_department_employees(
    department_id: int,
    page: int = 1,
    size: int = 10,
    order: Literal["asc", "desc"] = "desc",
    department_service: DepartmentService = Depends(get_department_service),
    employee_service: EmployeeService = Depends(get_employee_service),
) -> EmployeeListResponse:
    try:
        await department_service.get(department_id)
    except DepartmentNotFoundException as e:
        _handle(e)
    pagination = EmployeePaginationParams(page=page, size=size)
    search = _EmployeeSearchParams(department_id=department_id, order=order)
    return await employee_service.list(pagination, search)


@router.patch(
    "/{department_id}",
    response_model=DepartmentRead,
    dependencies=[Depends(require_permission("departments:update"))],
)
async def update_department(
    department_id: int,
    data: DepartmentUpdate,
    service: DepartmentService = Depends(get_department_service),
) -> DepartmentRead:
    try:
        return await service.update(department_id, data)
    except (
        DepartmentNotFoundException,
        DepartmentAlreadyExistsException,
        DatabaseException,
    ) as e:
        _handle(e)


@router.delete(
    "/{department_id}",
    status_code=204,
    dependencies=[Depends(require_permission("departments:delete"))],
)
async def delete_department(
    department_id: int,
    service: DepartmentService = Depends(get_department_service),
) -> None:
    try:
        await service.delete(department_id)
    except (DepartmentNotFoundException, DatabaseException) as e:
        _handle(e)
