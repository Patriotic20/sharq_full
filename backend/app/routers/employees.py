from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import db_helper
from app.exceptions.employee import (
    DatabaseException,
    EmployeeNotFoundException,
    EmployeeAlreadyExistsException,
)
from app.repositories.employee import EmployeeRepository
from app.schemas.employee import (
    EmployeeListResponse,
    EmployeeRead,
    EmployeeSearchParams,
    EmployeeUpdate,
    PaginationParams,
)
from app.services.employee import EmployeeService

router = APIRouter(prefix="/employees", tags=["employees"])


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async for session in db_helper.session_getter():
        yield session


def get_employee_service(
    session: AsyncSession = Depends(get_session),
) -> EmployeeService:
    return EmployeeService(EmployeeRepository(session))


def _handle(exc: EmployeeNotFoundException | EmployeeAlreadyExistsException | DatabaseException) -> None:
    raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.get("/", response_model=EmployeeListResponse)
async def list_employees(
    page: int = 1,
    size: int = 10,
    first_name: str | None = None,
    last_name: str | None = None,
    camera_user_id: str | None = None,
    service: EmployeeService = Depends(get_employee_service),
) -> EmployeeListResponse:
    pagination = PaginationParams(page=page, size=size)
    search = EmployeeSearchParams(first_name=first_name, last_name=last_name, camera_user_id=camera_user_id)
    return await service.list(pagination, search)


@router.get("/{employee_id}", response_model=EmployeeRead)
async def get_employee(
    employee_id: int,
    service: EmployeeService = Depends(get_employee_service),
) -> EmployeeRead:
    try:
        return await service.get(employee_id)
    except EmployeeNotFoundException as e:
        _handle(e)


@router.patch("/{employee_id}", response_model=EmployeeRead)
async def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    service: EmployeeService = Depends(get_employee_service),
) -> EmployeeRead:
    try:
        return await service.update(employee_id, data)
    except (EmployeeNotFoundException, EmployeeAlreadyExistsException, DatabaseException) as e:
        _handle(e)


@router.delete("/{employee_id}", status_code=204)
async def delete_employee(
    employee_id: int,
    service: EmployeeService = Depends(get_employee_service),
) -> None:
    try:
        await service.delete(employee_id)
    except (EmployeeNotFoundException, DatabaseException) as e:
        _handle(e)
