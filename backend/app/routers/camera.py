from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import db_helper
from app.exceptions.camera import (
    CameraAlreadyExistsException,
    CameraNotFoundException,
    DatabaseException,
)
from app.repositories.camera import CameraRepository
from app.schemas.camera import (
    CameraCreate,
    CameraListResponse,
    CameraRead,
    CameraSearchParams,
    CameraUpdate,
    PaginationParams,
)
from app.services.camera import CameraService

router = APIRouter(prefix="/cameras", tags=["cameras"])


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async for session in db_helper.session_getter():
        yield session


def get_camera_service(
    session: AsyncSession = Depends(get_session),
) -> CameraService:
    return CameraService(CameraRepository(session))


def _handle(exc: CameraNotFoundException | CameraAlreadyExistsException | DatabaseException) -> None:
    raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.post("/", response_model=CameraRead, status_code=201)
async def create_camera(
    data: CameraCreate,
    service: CameraService = Depends(get_camera_service),
) -> CameraRead:
    try:
        return await service.create(data)
    except (CameraAlreadyExistsException, DatabaseException) as e:
        _handle(e)


@router.get("/", response_model=CameraListResponse)
async def list_cameras(
    page: int = 1,
    size: int = 10,
    ip_address: str | None = None,
    login: str | None = None,
    type: str | None = None,
    service: CameraService = Depends(get_camera_service),
) -> CameraListResponse:
    pagination = PaginationParams(page=page, size=size)
    search = CameraSearchParams(ip_address=ip_address, login=login, type=type)
    return await service.list(pagination, search)


@router.get("/{camera_id}", response_model=CameraRead)
async def get_camera(
    camera_id: int,
    service: CameraService = Depends(get_camera_service),
) -> CameraRead:
    try:
        return await service.get(camera_id)
    except CameraNotFoundException as e:
        _handle(e)


@router.patch("/{camera_id}", response_model=CameraRead)
async def update_camera(
    camera_id: int,
    data: CameraUpdate,
    service: CameraService = Depends(get_camera_service),
) -> CameraRead:
    try:
        return await service.update(camera_id, data)
    except (CameraNotFoundException, DatabaseException) as e:
        _handle(e)


@router.delete("/{camera_id}", status_code=204)
async def delete_camera(
    camera_id: int,
    service: CameraService = Depends(get_camera_service),
) -> None:
    try:
        await service.delete(camera_id)
    except (CameraNotFoundException, DatabaseException) as e:
        _handle(e)
