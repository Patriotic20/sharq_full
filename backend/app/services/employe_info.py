from app.exceptions.department import DepartmentNotFoundException
from app.exceptions.employee import EmployeeNotFoundException
from app.exceptions.employe_info import (
    EmployeeInfoAlreadyExistsException,
    EmployeeInfoNotFoundException,
)
from app.repositories.department import DepartmentRepository
from app.repositories.employee import EmployeeRepository
from app.repositories.employe_info import EmployeeInfoRepository
from app.schemas.common import PaginationParams
from app.schemas.employe_info import (
    EmployeeInfoCreate,
    EmployeeInfoListResponse,
    EmployeeInfoRead,
    EmployeeInfoSearchParams,
    EmployeeInfoUpdate,
)


class EmployeeInfoService:
    def __init__(
        self,
        repo: EmployeeInfoRepository,
        employee_repo: EmployeeRepository,
        department_repo: DepartmentRepository,
    ) -> None:
        self.repo = repo
        self.employee_repo = employee_repo
        self.department_repo = department_repo

    async def _validate_employee(self, employee_id: int) -> None:
        if await self.employee_repo.get_by_id(employee_id) is None:
            raise EmployeeNotFoundException()

    async def _validate_department(self, department_id: int | None) -> None:
        if department_id is None:
            return
        if await self.department_repo.get_by_id(department_id) is None:
            raise DepartmentNotFoundException()

    async def create(self, data: EmployeeInfoCreate) -> EmployeeInfoRead:
        await self._validate_employee(data.employee_id)
        await self._validate_department(data.department_id)
        if await self.repo.get_by_employee_id(data.employee_id):
            raise EmployeeInfoAlreadyExistsException()
        info = await self.repo.create(data)
        return EmployeeInfoRead.model_validate(info)

    async def list(
        self,
        pagination: PaginationParams,
        search: EmployeeInfoSearchParams,
    ) -> EmployeeInfoListResponse:
        items, total = await self.repo.list(
            limit=pagination.limit,
            offset=pagination.offset,
            full_name=search.full_name,
            department_id=search.department_id,
            employee_id=search.employee_id,
            order=search.order,
        )
        return EmployeeInfoListResponse.build(
            items=[EmployeeInfoRead.model_validate(i) for i in items],
            total=total,
            pagination=pagination,
        )

    async def get(self, info_id: int) -> EmployeeInfoRead:
        info = await self.repo.get_by_id(info_id)
        if not info:
            raise EmployeeInfoNotFoundException()
        return EmployeeInfoRead.model_validate(info)

    async def update(
        self, info_id: int, data: EmployeeInfoUpdate
    ) -> EmployeeInfoRead:
        info = await self.repo.get_by_id(info_id)
        if not info:
            raise EmployeeInfoNotFoundException()
        if "department_id" in data.model_fields_set:
            await self._validate_department(data.department_id)
        info = await self.repo.update(info, data)
        return EmployeeInfoRead.model_validate(info)

    async def delete(self, info_id: int) -> None:
        info = await self.repo.get_by_id(info_id)
        if not info:
            raise EmployeeInfoNotFoundException()
        await self.repo.delete(info)
