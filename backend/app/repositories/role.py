from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.exceptions.role import DatabaseException
from app.models.role import Role
from app.schemas.role import RoleCreate, RoleUpdate


class RoleRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, data: RoleCreate) -> Role:
        role = Role(**data.model_dump())
        self.session.add(role)
        try:
            await self.session.commit()
            await self.session.refresh(role)
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
        return role

    async def get_by_id(self, role_id: int) -> Role | None:
        result = await self.session.execute(select(Role).where(Role.id == role_id))
        return result.scalar_one_or_none()

    async def get_with_permissions(self, role_id: int) -> Role | None:
        result = await self.session.execute(
            select(Role)
            .options(selectinload(Role.permissions))
            .where(Role.id == role_id)
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> Role | None:
        result = await self.session.execute(select(Role).where(Role.name == name))
        return result.scalar_one_or_none()

    async def list(self, limit: int, offset: int) -> tuple[list[Role], int]:
        count_result = await self.session.execute(select(func.count()).select_from(Role))
        total = count_result.scalar_one()
        result = await self.session.execute(
            select(Role).order_by(Role.id).limit(limit).offset(offset)
        )
        return list(result.scalars().all()), total

    async def update(self, role: Role, data: RoleUpdate) -> Role:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(role, field, value)
        try:
            await self.session.commit()
            await self.session.refresh(role)
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
        return role

    async def delete(self, role: Role) -> None:
        try:
            await self.session.delete(role)
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise DatabaseException()

    async def count_users(self, role_id: int) -> int:
        from app.models.user import User
        result = await self.session.execute(
            select(func.count()).select_from(User).where(User.role_id == role_id)
        )
        return result.scalar_one()
