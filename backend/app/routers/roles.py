from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_session, require_permission
from app.exceptions.role import (
    DatabaseException,
    RoleAlreadyExistsException,
    RoleInUseException,
    RoleNotFoundException,
)
from app.repositories.role import RoleRepository
from app.schemas.common import PaginationParams
from app.schemas.role import (
    RoleCreate,
    RoleListResponse,
    RoleRead,
    RoleUpdate,
    RoleWithPermissionsRead,
)
from app.services.role import RoleService

router = APIRouter(prefix="/roles", tags=["roles"])


def get_role_service(session: AsyncSession = Depends(get_session)) -> RoleService:
    return RoleService(RoleRepository(session))


def _handle(
    exc: RoleNotFoundException
    | RoleAlreadyExistsException
    | RoleInUseException
    | DatabaseException,
) -> None:
    raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.post(
    "/",
    response_model=RoleRead,
    status_code=201,
    dependencies=[Depends(require_permission("roles:write"))],
)
async def create_role(
    data: RoleCreate,
    service: RoleService = Depends(get_role_service),
) -> RoleRead:
    try:
        return await service.create(data)
    except (RoleAlreadyExistsException, DatabaseException) as e:
        _handle(e)


@router.get(
    "/",
    response_model=RoleListResponse,
    dependencies=[Depends(require_permission("roles:read"))],
)
async def list_roles(
    page: int = 1,
    size: int = 10,
    service: RoleService = Depends(get_role_service),
) -> RoleListResponse:
    pagination = PaginationParams(page=page, size=size)
    return await service.list(pagination)


@router.get(
    "/{role_id}",
    response_model=RoleRead,
    dependencies=[Depends(require_permission("roles:read"))],
)
async def get_role(
    role_id: int,
    service: RoleService = Depends(get_role_service),
) -> RoleRead:
    try:
        return await service.get(role_id)
    except RoleNotFoundException as e:
        _handle(e)


@router.get(
    "/{role_id}/permissions",
    response_model=RoleWithPermissionsRead,
    dependencies=[Depends(require_permission("roles:read"))],
)
async def get_role_with_permissions(
    role_id: int,
    service: RoleService = Depends(get_role_service),
) -> RoleWithPermissionsRead:
    try:
        return await service.get_with_permissions(role_id)
    except RoleNotFoundException as e:
        _handle(e)


@router.patch(
    "/{role_id}",
    response_model=RoleRead,
    dependencies=[Depends(require_permission("roles:update"))],
)
async def update_role(
    role_id: int,
    data: RoleUpdate,
    service: RoleService = Depends(get_role_service),
) -> RoleRead:
    try:
        return await service.update(role_id, data)
    except (RoleNotFoundException, RoleAlreadyExistsException, DatabaseException) as e:
        _handle(e)


@router.delete(
    "/{role_id}",
    status_code=204,
    dependencies=[Depends(require_permission("roles:delete"))],
)
async def delete_role(
    role_id: int,
    service: RoleService = Depends(get_role_service),
) -> None:
    try:
        await service.delete(role_id)
    except (RoleNotFoundException, RoleInUseException, DatabaseException) as e:
        _handle(e)
