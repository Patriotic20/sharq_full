from app.exceptions.camera import CameraAlreadyExistsException, CameraNotFoundException
from app.repositories.camera import CameraRepository
from app.schemas.camera import (
    CameraCreate,
    CameraListResponse,
    CameraRead,
    CameraSearchParams,
    CameraUpdate,
    PaginationParams,
)


class CameraService:
    def __init__(self, repo: CameraRepository) -> None:
        self.repo = repo

    async def create(self, data: CameraCreate) -> CameraRead:
        existing = await self.repo.get_by_ip(data.ip_address)
        if existing:
            raise CameraAlreadyExistsException()
        camera = await self.repo.create(data)
        return CameraRead.model_validate(camera)

    async def list(
        self,
        pagination: PaginationParams,
        search: CameraSearchParams,
    ) -> CameraListResponse:
        items, total = await self.repo.list(
            limit=pagination.limit,
            offset=pagination.offset,
            ip_address=search.ip_address,
            login=search.login,
            type=search.type,
        )
        return CameraListResponse.build(
            items=[CameraRead.model_validate(c) for c in items],
            total=total,
            pagination=pagination,
        )

    async def get(self, camera_id: int) -> CameraRead:
        camera = await self.repo.get_by_id(camera_id)
        if not camera:
            raise CameraNotFoundException()
        return CameraRead.model_validate(camera)

    async def update(self, camera_id: int, data: CameraUpdate) -> CameraRead:
        camera = await self.repo.get_by_id(camera_id)
        if not camera:
            raise CameraNotFoundException()
        camera = await self.repo.update(camera, data)
        return CameraRead.model_validate(camera)

    async def delete(self, camera_id: int) -> None:
        camera = await self.repo.get_by_id(camera_id)
        if not camera:
            raise CameraNotFoundException()
        await self.repo.delete(camera)
