from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.department import DatabaseException
from app.models.department import Department
from app.models.employees import Employee
from app.schemas.department import DepartmentCreate, DepartmentUpdate


class DepartmentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, data: DepartmentCreate) -> Department:
        department = Department(**data.model_dump())
        self.session.add(department)
        try:
            await self.session.commit()
            await self.session.refresh(department)
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
        return department

    async def get_by_id(self, department_id: int) -> Department | None:
        result = await self.session.execute(
            select(Department).where(Department.id == department_id)
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> Department | None:
        result = await self.session.execute(
            select(Department).where(Department.name == name)
        )
        return result.scalar_one_or_none()

    async def list_with_count(
        self,
        limit: int,
        offset: int,
        name: str | None,
        order: str = "desc",
    ) -> tuple[list[tuple[Department, int]], int]:
        base_query = select(Department)
        if name:
            base_query = base_query.where(Department.name.ilike(f"%{name}%"))

        count_result = await self.session.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar_one()

        order_col = (
            Department.created_at.asc() if order == "asc" else Department.created_at.desc()
        )

        query = (
            select(
                Department,
                func.count(Employee.id).label("employees_count"),
            )
            .outerjoin(Employee, Employee.department_id == Department.id)
            .group_by(Department.id)
        )
        if name:
            query = query.where(Department.name.ilike(f"%{name}%"))
        query = query.order_by(order_col).limit(limit).offset(offset)

        result = await self.session.execute(query)
        rows = [(row[0], int(row[1])) for row in result.all()]
        return rows, total

    async def count_employees(self, department_id: int) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(Employee)
            .where(Employee.department_id == department_id)
        )
        return result.scalar_one()

    async def update(self, department: Department, data: DepartmentUpdate) -> Department:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(department, field, value)
        try:
            await self.session.commit()
            await self.session.refresh(department)
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
        return department

    async def delete(self, department: Department) -> None:
        try:
            await self.session.delete(department)
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
