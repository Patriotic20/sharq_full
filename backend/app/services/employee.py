from app.exceptions.department import DepartmentNotFoundException
from app.exceptions.employee import EmployeeAlreadyExistsException, EmployeeNotFoundException
from app.exceptions.position import PositionNotFoundException
from app.repositories.department import DepartmentRepository
from app.repositories.employee import EmployeeRepository
from app.repositories.employe_info import EmployeeInfoRepository
from app.repositories.position import PositionRepository
from app.schemas.employe_info import EmployeeInfoCreate
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeListResponse,
    EmployeeRead,
    EmployeeSearchParams,
    EmployeeUpdate,
    PaginationParams,
)


class EmployeeService:
    def __init__(
        self,
        repo: EmployeeRepository,
        department_repo: DepartmentRepository | None = None,
        position_repo: PositionRepository | None = None,
        info_repo: EmployeeInfoRepository | None = None,
    ) -> None:
        self.repo = repo
        self.department_repo = department_repo
        self.position_repo = position_repo
        self.info_repo = info_repo

    async def _validate_department(self, department_id: int | None) -> None:
        if department_id is None or self.department_repo is None:
            return
        if await self.department_repo.get_by_id(department_id) is None:
            raise DepartmentNotFoundException()

    async def _validate_position(self, position_id: int | None) -> None:
        if position_id is None or self.position_repo is None:
            return
        if await self.position_repo.get_by_id(position_id) is None:
            raise PositionNotFoundException()

    async def create(self, data: EmployeeCreate) -> EmployeeRead:
        if data.camera_user_id:
            existing = await self.repo.get_by_camera_user_id(data.camera_user_id)
            if existing:
                raise EmployeeAlreadyExistsException()
        employee = await self.repo.create(data)
        if self.info_repo is not None:
            full_name = f"{employee.last_name} {employee.first_name} {employee.middle_name}"
            try:
                await self.info_repo.create(
                    EmployeeInfoCreate(employee_id=employee.id, full_name=full_name)
                )
            except Exception:
                await self.repo.delete(employee)
                raise
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
            department_id=search.department_id,
            status=search.status,
            order=search.order,
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
        if "department_id" in data.model_fields_set:
            await self._validate_department(data.department_id)
        if "position_id" in data.model_fields_set:
            await self._validate_position(data.position_id)
        employee = await self.repo.update(employee, data)
        return EmployeeRead.model_validate(employee)

    async def delete(self, employee_id: int) -> None:
        employee = await self.repo.get_by_id(employee_id)
        if not employee:
            raise EmployeeNotFoundException()
        await self.repo.delete(employee)
