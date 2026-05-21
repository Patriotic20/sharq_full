from datetime import date as DateType

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.holiday import Holiday
from app.schemas.holiday import HolidayCreate, HolidayUpdate


class HolidayRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, data: HolidayCreate) -> Holiday:
        holiday = Holiday(**data.model_dump())
        self.session.add(holiday)
        try:
            await self.session.commit()
            await self.session.refresh(holiday)
        except Exception:
            await self.session.rollback()
            raise
        return holiday

    async def get_by_id(self, holiday_id: int) -> Holiday | None:
        result = await self.session.execute(select(Holiday).where(Holiday.id == holiday_id))
        return result.scalar_one_or_none()

    async def get_by_date(self, day: DateType) -> Holiday | None:
        result = await self.session.execute(select(Holiday).where(Holiday.date == day))
        return result.scalar_one_or_none()

    async def list(self, limit: int, offset: int) -> tuple[list[Holiday], int]:
        count_res = await self.session.execute(select(func.count()).select_from(Holiday))
        total = count_res.scalar_one()
        res = await self.session.execute(
            select(Holiday).order_by(Holiday.date).limit(limit).offset(offset)
        )
        return list(res.scalars().all()), total

    async def list_in_range(self, date_from: DateType, date_to: DateType) -> list[Holiday]:
        res = await self.session.execute(
            select(Holiday)
            .where(Holiday.date >= date_from, Holiday.date <= date_to)
            .order_by(Holiday.date)
        )
        return list(res.scalars().all())

    async def list_recurring(self) -> list[Holiday]:
        res = await self.session.execute(
            select(Holiday).where(Holiday.is_recurring.is_(True))
        )
        return list(res.scalars().all())

    async def update(self, holiday: Holiday, data: HolidayUpdate) -> Holiday:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(holiday, field, value)
        await self.session.commit()
        await self.session.refresh(holiday)
        return holiday

    async def delete(self, holiday: Holiday) -> None:
        await self.session.delete(holiday)
        await self.session.commit()
