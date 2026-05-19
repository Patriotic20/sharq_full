from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.permission import Permission


class PermissionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_all(self) -> list[Permission]:
        result = await self.session.execute(select(Permission).order_by(Permission.code))
        return list(result.scalars().all())

    async def get_by_id(self, permission_id: int) -> Permission | None:
        result = await self.session.execute(
            select(Permission).where(Permission.id == permission_id)
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> Permission | None:
        result = await self.session.execute(
            select(Permission).where(Permission.code == code)
        )
        return result.scalar_one_or_none()

    async def get_by_ids(self, permission_ids: list[int]) -> list[Permission]:
        if not permission_ids:
            return []
        result = await self.session.execute(
            select(Permission).where(Permission.id.in_(permission_ids))
        )
        return list(result.scalars().all())

    async def bulk_upsert(self, defs: list[tuple[str, str | None]]) -> None:
        if not defs:
            return
        stmt = pg_insert(Permission).values(
            [{"code": code, "description": description} for code, description in defs]
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=[Permission.code],
            set_={"description": stmt.excluded.description},
        )
        await self.session.execute(stmt)
        await self.session.commit()
