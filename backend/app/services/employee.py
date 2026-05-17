from app.exceptions.employee import EmployeeAlreadyExistsException, EmployeeNotFoundException
from app.repositories.employee import EmployeeRepository
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeListResponse,
    EmployeeRead,
    EmployeeSearchParams,
    EmployeeUpdate,
    PaginationParams,
)


class EmployeeService:
    def __init__(self, repo: EmployeeRepository) -> None:
        self.repo = repo

    async def create(self, data: EmployeeCreate) -> EmployeeRead:
        if data.camera_user_id:
            existing = await self.repo.get_by_camera_user_id(data.camera_user_id)
            if existing:
                raise EmployeeAlreadyExistsException()
        employee = await self.repo.create(data)
        return EmployeeRead.model_validate(employee)

    async def list(
        self,
        pagination: PaginationParams,
        search: EmployeeSearchParams,
    ) -> EmployeeListResponse:
        items, total = await self.repo.list(
            limit=pagination.limit,
            offset=pagination.offset,
            first_name=search.first_name,
            last_name=search.last_name,
            camera_user_id=search.camera_user_id,
        )
        return EmployeeListResponse.build(
            items=[EmployeeRead.model_validate(e) for e in items],
            total=total,
            pagination=pagination,
        )

    async def get(self, employee_id: int) -> EmployeeRead:
        employee = await self.repo.get_by_id(employee_id)
        if not employee:
            raise EmployeeNotFoundException()
        return EmployeeRead.model_validate(employee)

    async def update(self, employee_id: int, data: EmployeeUpdate) -> EmployeeRead:
        employee = await self.repo.get_by_id(employee_id)
        if not employee:
            raise EmployeeNotFoundException()
        if data.camera_user_id and data.camera_user_id != employee.camera_user_id:
            existing = await self.repo.get_by_camera_user_id(data.camera_user_id)
            if existing:
                raise EmployeeAlreadyExistsException()
        employee = await self.repo.update(employee, data)
        return EmployeeRead.model_validate(employee)

    async def delete(self, employee_id: int) -> None:
        employee = await self.repo.get_by_id(employee_id)
        if not employee:
            raise EmployeeNotFoundException()
        await self.repo.delete(employee)
