from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.enums.employee_status import EmployeeStatus
from app.exceptions.employee import DatabaseException
from app.models.employees import Employee
from app.schemas.employee import EmployeeCreate, EmployeeUpdate


class EmployeeRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, data: EmployeeCreate) -> Employee:
        employee = Employee(**data.model_dump())
        self.session.add(employee)
        try:
            await self.session.commit()
            await self.session.refresh(employee)
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
        return employee

    async def get_by_id(self, employee_id: int) -> Employee | None:
        result = await self.session.execute(
            select(Employee).where(Employee.id == employee_id)
        )
        return result.scalar_one_or_none()

    async def get_by_camera_user_id(self, camera_user_id: str) -> Employee | None:
        result = await self.session.execute(
            select(Employee).where(Employee.camera_user_id == camera_user_id)
        )
        return result.scalar_one_or_none()

    async def list(
        self,
        limit: int,
        offset: int,
        first_name: str | None,
        last_name: str | None,
        camera_user_id: str | None,
        department_id: int | None = None,
        status: EmployeeStatus | None = None,
        order: str = "desc",
    ) -> tuple[list[Employee], int]:
        query = select(Employee)

        if first_name:
            query = query.where(Employee.first_name.ilike(f"%{first_name}%"))
        if last_name:
            query = query.where(Employee.last_name.ilike(f"%{last_name}%"))
        if camera_user_id:
            query = query.where(Employee.camera_user_id.ilike(f"%{camera_user_id}%"))
        if department_id is not None:
            query = query.where(Employee.department_id == department_id)
        if status is not None:
            query = query.where(Employee.status == status)

        count_result = await self.session.execute(
            select(func.count()).select_from(query.subquery())
        )
        total = count_result.scalar_one()

        order_col = Employee.created_at.asc() if order == "asc" else Employee.created_at.desc()
        result = await self.session.execute(
            query.order_by(order_col).limit(limit).offset(offset)
        )
        items = list(result.scalars().unique().all())

        return items, total

    async def update(self, employee: Employee, data: EmployeeUpdate) -> Employee:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(employee, field, value)
        try:
            await self.session.commit()
            await self.session.refresh(employee)
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
        return employee

    async def delete(self, employee: Employee) -> None:
        try:
            await self.session.delete(employee)
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
