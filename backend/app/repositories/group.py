from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.group import DatabaseException
from app.models.group import Group
from app.schemas.group import GroupCreate, GroupUpdate


class GroupRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, data: GroupCreate) -> Group:
        group = Group(**data.model_dump())
        self.session.add(group)
        try:
            await self.session.commit()
            await self.session.refresh(group)
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
        return group

    async def get_by_id(self, group_id: int) -> Group | None:
        result = await self.session.execute(select(Group).where(Group.id == group_id))
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> Group | None:
        result = await self.session.execute(select(Group).where(Group.name == name))
        return result.scalar_one_or_none()

    async def list(
        self,
        limit: int,
        offset: int,
        name: str | None,
        order: str = "desc",
    ) -> tuple[list[Group], int]:
        query = select(Group)
        if name:
            query = query.where(Group.name.ilike(f"%{name}%"))

        count_result = await self.session.execute(
            select(func.count()).select_from(query.subquery())
        )
        total = count_result.scalar_one()

        order_col = Group.created_at.asc() if order == "asc" else Group.created_at.desc()
        result = await self.session.execute(
            query.order_by(order_col).limit(limit).offset(offset)
        )
        return list(result.scalars().all()), total

    async def update(self, group: Group, data: GroupUpdate) -> Group:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(group, field, value)
        try:
            await self.session.commit()
            await self.session.refresh(group)
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
        return group

    async def delete(self, group: Group) -> None:
        try:
            await self.session.delete(group)
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
