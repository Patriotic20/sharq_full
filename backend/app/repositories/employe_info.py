from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.employe_info import DatabaseException
from app.models.employe_info import EmployeeInfo
from app.schemas.employe_info import EmployeeInfoCreate, EmployeeInfoUpdate


class EmployeeInfoRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, data: EmployeeInfoCreate) -> EmployeeInfo:
        info = EmployeeInfo(**data.model_dump())
        self.session.add(info)
        try:
            await self.session.commit()
            await self.session.refresh(info)
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
        return info

    async def get_by_id(self, info_id: int) -> EmployeeInfo | None:
        result = await self.session.execute(
            select(EmployeeInfo).where(EmployeeInfo.id == info_id)
        )
        return result.scalar_one_or_none()

    async def get_by_employee_id(self, employee_id: int) -> EmployeeInfo | None:
        result = await self.session.execute(
            select(EmployeeInfo).where(EmployeeInfo.employee_id == employee_id)
        )
        return result.scalar_one_or_none()

    async def list(
        self,
        limit: int,
        offset: int,
        full_name: str | None,
        department_id: int | None,
        employee_id: int | None,
        order: str = "desc",
    ) -> tuple[list[EmployeeInfo], int]:
        query = select(EmployeeInfo)

        if full_name:
            query = query.where(EmployeeInfo.full_name.ilike(f"%{full_name}%"))
        if department_id is not None:
            query = query.where(EmployeeInfo.department_id == department_id)
        if employee_id is not None:
            query = query.where(EmployeeInfo.employee_id == employee_id)

        count_result = await self.session.execute(
            select(func.count()).select_from(query.subquery())
        )
        total = count_result.scalar_one()

        order_col = (
            EmployeeInfo.created_at.asc()
            if order == "asc"
            else EmployeeInfo.created_at.desc()
        )
        result = await self.session.execute(
            query.order_by(order_col).limit(limit).offset(offset)
        )
        items = list(result.scalars().unique().all())
        return items, total

    async def update(
        self, info: EmployeeInfo, data: EmployeeInfoUpdate
    ) -> EmployeeInfo:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(info, field, value)
        try:
            await self.session.commit()
            await self.session.refresh(info)
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
        return info

    async def delete(self, info: EmployeeInfo) -> None:
        try:
            await self.session.delete(info)
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
