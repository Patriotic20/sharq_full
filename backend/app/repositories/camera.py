from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.enums.camera import CameraType
from app.exceptions.camera import DatabaseException
from app.models.cameras import Camera
from app.schemas.camera import CameraCreate, CameraUpdate


class CameraRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, data: CameraCreate) -> Camera:
        camera = Camera(**data.model_dump())
        self.session.add(camera)
        try:
            await self.session.commit()
            await self.session.refresh(camera)
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
        return camera

    async def get_by_id(self, camera_id: int) -> Camera | None:
        result = await self.session.execute(
            select(Camera).where(Camera.id == camera_id)
        )
        return result.scalar_one_or_none()

    async def get_by_ip(self, ip_address: str) -> Camera | None:
        result = await self.session.execute(
            select(Camera).where(Camera.ip_address == ip_address)
        )
        return result.scalar_one_or_none()

    async def list(
        self,
        limit: int,
        offset: int,
        ip_address: str | None,
        login: str | None,
        type: CameraType | None,
    ) -> tuple[list[Camera], int]:
        query = select(Camera)

        if ip_address:
            query = query.where(Camera.ip_address.ilike(f"%{ip_address}%"))
        if login:
            query = query.where(Camera.login.ilike(f"%{login}%"))
        if type:
            query = query.where(Camera.type == type)

        count_result = await self.session.execute(
            select(func.count()).select_from(query.subquery())
        )
        total = count_result.scalar_one()

        result = await self.session.execute(query.limit(limit).offset(offset))
        items = list(result.scalars().all())

        return items, total

    async def update(self, camera: Camera, data: CameraUpdate) -> Camera:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(camera, field, value)
        try:
            await self.session.commit()
            await self.session.refresh(camera)
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
        return camera

    async def delete(self, camera: Camera) -> None:
        try:
            await self.session.delete(camera)
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
