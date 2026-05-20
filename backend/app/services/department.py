from app.exceptions.department import (
    DepartmentAlreadyExistsException,
    DepartmentNotFoundException,
)
from app.repositories.department import DepartmentRepository
from app.schemas.common import PaginationParams
from app.schemas.department import (
    DepartmentCreate,
    DepartmentListResponse,
    DepartmentRead,
    DepartmentSearchParams,
    DepartmentUpdate,
)


class DepartmentService:
    def __init__(self, repo: DepartmentRepository) -> None:
        self.repo = repo

    async def create(self, data: DepartmentCreate) -> DepartmentRead:
        if await self.repo.get_by_name(data.name) is not None:
            raise DepartmentAlreadyExistsException()
        department = await self.repo.create(data)
        return DepartmentRead.model_validate(department)

    async def get(self, department_id: int) -> DepartmentRead:
        department = await self.repo.get_by_id(department_id)
        if not department:
            raise DepartmentNotFoundException()
        employees_count = await self.repo.count_employees(department_id)
        return DepartmentRead(
            id=department.id,
            name=department.name,
            created_at=department.created_at,
            updated_at=department.updated_at,
            employees_count=employees_count,
        )

    async def list(
        self,
        pagination: PaginationParams,
        search: DepartmentSearchParams,
    ) -> DepartmentListResponse:
        rows, total = await self.repo.list_with_count(
            limit=pagination.limit,
            offset=pagination.offset,
            name=search.name,
            order=search.order,
        )
        items = [
            DepartmentRead(
                id=d.id,
                name=d.name,
                created_at=d.created_at,
                updated_at=d.updated_at,
                employees_count=count,
            )
            for d, count in rows
        ]
        return DepartmentListResponse.build(
            items=items,
            total=total,
            pagination=pagination,
        )

    async def update(
        self, department_id: int, data: DepartmentUpdate
    ) -> DepartmentRead:
        department = await self.repo.get_by_id(department_id)
        if not department:
            raise DepartmentNotFoundException()
        if data.name and data.name != department.name:
            if await self.repo.get_by_name(data.name) is not None:
                raise DepartmentAlreadyExistsException()
        department = await self.repo.update(department, data)
        return DepartmentRead.model_validate(department)

    async def delete(self, department_id: int) -> None:
        department = await self.repo.get_by_id(department_id)
        if not department:
            raise DepartmentNotFoundException()
        await self.repo.delete(department)
