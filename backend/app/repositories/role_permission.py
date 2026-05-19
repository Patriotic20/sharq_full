from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.role import DatabaseException
from app.models.role_permission import RolePermission


class RolePermissionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_permission_ids(self, role_id: int) -> list[int]:
        result = await self.session.execute(
            select(RolePermission.permission_id).where(RolePermission.role_id == role_id)
        )
        return [row[0] for row in result.all()]

    async def assign(self, role_id: int, permission_ids: list[int]) -> None:
        if not permission_ids:
            return
        rows = [
            {"role_id": role_id, "permission_id": pid} for pid in set(permission_ids)
        ]
        stmt = pg_insert(RolePermission).values(rows).on_conflict_do_nothing(
            index_elements=[RolePermission.role_id, RolePermission.permission_id]
        )
        try:
            await self.session.execute(stmt)
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise DatabaseException()

    async def revoke(self, role_id: int, permission_ids: list[int]) -> None:
        if not permission_ids:
            return
        try:
            await self.session.execute(
                delete(RolePermission).where(
                    RolePermission.role_id == role_id,
                    RolePermission.permission_id.in_(permission_ids),
                )
            )
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise DatabaseException()

    async def replace(self, role_id: int, permission_ids: list[int]) -> None:
        try:
            await self.session.execute(
                delete(RolePermission).where(RolePermission.role_id == role_id)
            )
            if permission_ids:
                rows = [
                    {"role_id": role_id, "permission_id": pid}
                    for pid in set(permission_ids)
                ]
                await self.session.execute(pg_insert(RolePermission).values(rows))
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
