from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_session, require_permission
from app.exceptions.group import (
    DatabaseException,
    GroupAlreadyExistsException,
    GroupNotFoundException,
)
from app.repositories.group import GroupRepository
from app.schemas.common import PaginationParams
from app.schemas.group import (
    GroupCreate,
    GroupListResponse,
    GroupRead,
    GroupSearchParams,
    GroupUpdate,
)
from app.services.group import GroupService

router = APIRouter(prefix="/groups", tags=["groups"])


def get_group_service(
    session: AsyncSession = Depends(get_session),
) -> GroupService:
    return GroupService(GroupRepository(session))


def _handle(
    exc: GroupNotFoundException
    | GroupAlreadyExistsException
    | DatabaseException,
) -> None:
    raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.post(
    "/",
    response_model=GroupRead,
    status_code=201,
    dependencies=[Depends(require_permission("groups:write"))],
)
async def create_group(
    data: GroupCreate,
    service: GroupService = Depends(get_group_service),
) -> GroupRead:
    try:
        return await service.create(data)
    except (GroupAlreadyExistsException, DatabaseException) as e:
        _handle(e)


@router.get(
    "/",
    response_model=GroupListResponse,
    dependencies=[Depends(require_permission("groups:read"))],
)
async def list_groups(
    page: int = 1,
    size: int = 10,
    name: str | None = None,
    order: Literal["asc", "desc"] = "desc",
    service: GroupService = Depends(get_group_service),
) -> GroupListResponse:
    pagination = PaginationParams(page=page, size=size)
    search = GroupSearchParams(name=name, order=order)
    return await service.list(pagination, search)


@router.get(
    "/{group_id}",
    response_model=GroupRead,
    dependencies=[Depends(require_permission("groups:read"))],
)
async def get_group(
    group_id: int,
    service: GroupService = Depends(get_group_service),
) -> GroupRead:
    try:
        return await service.get(group_id)
    except GroupNotFoundException as e:
        _handle(e)


@router.patch(
    "/{group_id}",
    response_model=GroupRead,
    dependencies=[Depends(require_permission("groups:update"))],
)
async def update_group(
    group_id: int,
    data: GroupUpdate,
    service: GroupService = Depends(get_group_service),
) -> GroupRead:
    try:
        return await service.update(group_id, data)
    except (
        GroupNotFoundException,
        GroupAlreadyExistsException,
        DatabaseException,
    ) as e:
        _handle(e)


@router.delete(
    "/{group_id}",
    status_code=204,
    dependencies=[Depends(require_permission("groups:delete"))],
)
async def delete_group(
    group_id: int,
    service: GroupService = Depends(get_group_service),
) -> None:
    try:
        await service.delete(group_id)
    except (GroupNotFoundException, DatabaseException) as e:
        _handle(e)
