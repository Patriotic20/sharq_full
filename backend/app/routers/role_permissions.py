from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_session, require_permission
from app.exceptions.permission import PermissionNotFoundException
from app.exceptions.role import DatabaseException, RoleNotFoundException
from app.repositories.permission import PermissionRepository
from app.repositories.role import RoleRepository
from app.repositories.role_permission import RolePermissionRepository
from app.schemas.role import RoleWithPermissionsRead
from app.schemas.role_permission import RolePermissionAssign
from app.services.role_permission import RolePermissionService

router = APIRouter(prefix="/roles/{role_id}/permissions", tags=["role_permissions"])


def get_role_permission_service(
    session: AsyncSession = Depends(get_session),
) -> RolePermissionService:
    return RolePermissionService(
        RoleRepository(session),
        PermissionRepository(session),
        RolePermissionRepository(session),
    )


def _handle(
    exc: RoleNotFoundException | PermissionNotFoundException | DatabaseException,
) -> None:
    raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.put(
    "/",
    response_model=RoleWithPermissionsRead,
    dependencies=[Depends(require_permission("role_permissions:update"))],
)
async def replace_role_permissions(
    role_id: int,
    body: RolePermissionAssign,
    service: RolePermissionService = Depends(get_role_permission_service),
) -> RoleWithPermissionsRead:
    try:
        return await service.replace(role_id, body.permission_ids)
    except (RoleNotFoundException, PermissionNotFoundException, DatabaseException) as e:
        _handle(e)


@router.post(
    "/assign",
    response_model=RoleWithPermissionsRead,
    dependencies=[Depends(require_permission("role_permissions:update"))],
)
async def assign_role_permissions(
    role_id: int,
    body: RolePermissionAssign,
    service: RolePermissionService = Depends(get_role_permission_service),
) -> RoleWithPermissionsRead:
    try:
        return await service.assign(role_id, body.permission_ids)
    except (RoleNotFoundException, PermissionNotFoundException, DatabaseException) as e:
        _handle(e)


@router.post(
    "/revoke",
    response_model=RoleWithPermissionsRead,
    dependencies=[Depends(require_permission("role_permissions:delete"))],
)
async def revoke_role_permissions(
    role_id: int,
    body: RolePermissionAssign,
    service: RolePermissionService = Depends(get_role_permission_service),
) -> RoleWithPermissionsRead:
    try:
        return await service.revoke(role_id, body.permission_ids)
    except (RoleNotFoundException, DatabaseException) as e:
        _handle(e)
