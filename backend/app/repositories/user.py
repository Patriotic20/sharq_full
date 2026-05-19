from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.exceptions.user import DatabaseException
from app.models.role import Role
from app.models.user import User


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def _with_role(self):
        return selectinload(User.role).selectinload(Role.permissions)

    async def create(
        self,
        *,
        username: str,
        hashed_password: str,
        full_name: str | None,
        is_active: bool,
        role_id: int | None,
    ) -> User:
        user = User(
            username=username,
            hashed_password=hashed_password,
            full_name=full_name,
            is_active=is_active,
            role_id=role_id,
        )
        self.session.add(user)
        try:
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
        return await self.get_by_id(user.id)  # type: ignore[return-value]

    async def get_by_id(self, user_id: int) -> User | None:
        result = await self.session.execute(
            select(User).options(self._with_role()).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        result = await self.session.execute(
            select(User).options(self._with_role()).where(User.username == username)
        )
        return result.scalar_one_or_none()

    async def list(
        self,
        limit: int,
        offset: int,
        username: str | None,
        role_id: int | None,
        is_active: bool | None,
    ) -> tuple[list[User], int]:
        query = select(User).options(self._with_role())
        if username:
            query = query.where(User.username.ilike(f"%{username}%"))
        if role_id is not None:
            query = query.where(User.role_id == role_id)
        if is_active is not None:
            query = query.where(User.is_active == is_active)

        count_result = await self.session.execute(
            select(func.count()).select_from(query.subquery())
        )
        total = count_result.scalar_one()

        result = await self.session.execute(
            query.order_by(User.id).limit(limit).offset(offset)
        )
        return list(result.scalars().all()), total

    async def update(self, user: User, fields: dict) -> User:
        for field, value in fields.items():
            setattr(user, field, value)
        try:
            await self.session.commit()
            await self.session.refresh(user)
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
        return user

    async def delete(self, user: User) -> None:
        try:
            await self.session.delete(user)
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
