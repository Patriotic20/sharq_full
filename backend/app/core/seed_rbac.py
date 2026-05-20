import logging

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.permissions import PERMISSIONS, ROLE_PRESETS
from app.core.security import hash_password
from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.user import User
from app.repositories.permission import PermissionRepository

logger = logging.getLogger(__name__)


async def _seed_permissions(session: AsyncSession) -> dict[str, int]:
    repo = PermissionRepository(session)
    await repo.bulk_upsert([(p.code, p.description) for p in PERMISSIONS])

    current_codes = {p.code for p in PERMISSIONS}
    obsolete = await session.execute(
        select(Permission.code).where(Permission.code.notin_(current_codes))
    )
    obsolete_codes = [row[0] for row in obsolete.all()]
    if obsolete_codes:
        await session.execute(
            delete(Permission).where(Permission.code.in_(obsolete_codes))
        )
        await session.commit()
        logger.info("Pruned obsolete permissions: %s", obsolete_codes)

    permissions = await repo.list_all()
    return {p.code: p.id for p in permissions}


async def _seed_roles(
    session: AsyncSession,
    permission_ids_by_code: dict[str, int],
) -> dict[str, int]:
    name_to_id: dict[str, int] = {}
    for role_name, codes in ROLE_PRESETS.items():
        result = await session.execute(select(Role).where(Role.name == role_name))
        role = result.scalar_one_or_none()
        if role is None:
            role = Role(name=role_name, description=f"Auto-seeded role: {role_name}")
            session.add(role)
            await session.commit()
            await session.refresh(role)

        existing_links = await session.execute(
            select(RolePermission.permission_id).where(RolePermission.role_id == role.id)
        )
        existing_ids = {row[0] for row in existing_links.all()}
        desired_ids = {permission_ids_by_code[c] for c in codes if c in permission_ids_by_code}

        to_add = desired_ids - existing_ids
        for pid in to_add:
            session.add(RolePermission(role_id=role.id, permission_id=pid))
        if to_add:
            await session.commit()

        name_to_id[role_name] = role.id
    return name_to_id


async def _seed_admin_user(session: AsyncSession, admin_role_id: int) -> None:
    cfg = settings.admin
    result = await session.execute(select(User).where(User.username == cfg.username))
    if result.scalar_one_or_none() is not None:
        return
    user = User(
        username=cfg.username,
        hashed_password=hash_password(cfg.password),
        full_name=cfg.full_name,
        is_active=True,
        role_id=admin_role_id,
    )
    session.add(user)
    await session.commit()
    logger.info("Seeded admin user: %s", cfg.username)


async def seed_rbac(session: AsyncSession) -> None:
    permission_ids_by_code = await _seed_permissions(session)
    role_ids_by_name = await _seed_roles(session, permission_ids_by_code)
    admin_role_id = role_ids_by_name.get("admin")
    if admin_role_id is not None:
        await _seed_admin_user(session, admin_role_id)
