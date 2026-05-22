from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.position import DatabaseException
from app.models.position import Position
from app.schemas.position import PositionCreate, PositionUpdate


class PositionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, data: PositionCreate) -> Position:
        position = Position(**data.model_dump())
        self.session.add(position)
        try:
            await self.session.commit()
            await self.session.refresh(position)
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
        return position

    async def get_by_id(self, position_id: int) -> Position | None:
        result = await self.session.execute(
            select(Position).where(Position.id == position_id)
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> Position | None:
        result = await self.session.execute(
            select(Position).where(Position.name == name)
        )
        return result.scalar_one_or_none()

    async def list(
        self,
        limit: int,
        offset: int,
        name: str | None,
        order: str = "desc",
    ) -> tuple[list[Position], int]:
        query = select(Position)
        if name:
            query = query.where(Position.name.ilike(f"%{name}%"))

        count_result = await self.session.execute(
            select(func.count()).select_from(query.subquery())
        )
        total = count_result.scalar_one()

        order_col = (
            Position.created_at.asc() if order == "asc" else Position.created_at.desc()
        )
        result = await self.session.execute(
            query.order_by(order_col).limit(limit).offset(offset)
        )
        return list(result.scalars().all()), total

    async def update(self, position: Position, data: PositionUpdate) -> Position:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(position, field, value)
        try:
            await self.session.commit()
            await self.session.refresh(position)
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
        return position

    async def delete(self, position: Position) -> None:
        try:
            await self.session.delete(position)
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
