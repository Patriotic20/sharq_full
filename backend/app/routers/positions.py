from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_session, require_permission
from app.exceptions.position import (
    DatabaseException,
    PositionAlreadyExistsException,
    PositionNotFoundException,
)
from app.repositories.position import PositionRepository
from app.schemas.common import PaginationParams
from app.schemas.position import (
    PositionCreate,
    PositionListResponse,
    PositionRead,
    PositionSearchParams,
    PositionUpdate,
)
from app.services.position import PositionService

router = APIRouter(prefix="/positions", tags=["positions"])


def get_position_service(
    session: AsyncSession = Depends(get_session),
) -> PositionService:
    return PositionService(PositionRepository(session))


def _handle(
    exc: PositionNotFoundException
    | PositionAlreadyExistsException
    | DatabaseException,
) -> None:
    raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.post(
    "/",
    response_model=PositionRead,
    status_code=201,
    dependencies=[Depends(require_permission("positions:write"))],
)
async def create_position(
    data: PositionCreate,
    service: PositionService = Depends(get_position_service),
) -> PositionRead:
    try:
        return await service.create(data)
    except (PositionAlreadyExistsException, DatabaseException) as e:
        _handle(e)


@router.get(
    "/",
    response_model=PositionListResponse,
    dependencies=[Depends(require_permission("positions:read"))],
)
async def list_positions(
    page: int = 1,
    size: int = 10,
    name: str | None = None,
    order: Literal["asc", "desc"] = "desc",
    service: PositionService = Depends(get_position_service),
) -> PositionListResponse:
    pagination = PaginationParams(page=page, size=size)
    search = PositionSearchParams(name=name, order=order)
    return await service.list(pagination, search)


@router.get(
    "/{position_id}",
    response_model=PositionRead,
    dependencies=[Depends(require_permission("positions:read"))],
)
async def get_position(
    position_id: int,
    service: PositionService = Depends(get_position_service),
) -> PositionRead:
    try:
        return await service.get(position_id)
    except PositionNotFoundException as e:
        _handle(e)


@router.patch(
    "/{position_id}",
    response_model=PositionRead,
    dependencies=[Depends(require_permission("positions:update"))],
)
async def update_position(
    position_id: int,
    data: PositionUpdate,
    service: PositionService = Depends(get_position_service),
) -> PositionRead:
    try:
        return await service.update(position_id, data)
    except (
        PositionNotFoundException,
        PositionAlreadyExistsException,
        DatabaseException,
    ) as e:
        _handle(e)


@router.delete(
    "/{position_id}",
    status_code=204,
    dependencies=[Depends(require_permission("positions:delete"))],
)
async def delete_position(
    position_id: int,
    service: PositionService = Depends(get_position_service),
) -> None:
    try:
        await service.delete(position_id)
    except (PositionNotFoundException, DatabaseException) as e:
        _handle(e)
