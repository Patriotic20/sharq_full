from app.exceptions.position import (
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


class PositionService:
    def __init__(self, repo: PositionRepository) -> None:
        self.repo = repo

    async def create(self, data: PositionCreate) -> PositionRead:
        if await self.repo.get_by_name(data.name) is not None:
            raise PositionAlreadyExistsException()
        position = await self.repo.create(data)
        return PositionRead.model_validate(position)

    async def get(self, position_id: int) -> PositionRead:
        position = await self.repo.get_by_id(position_id)
        if not position:
            raise PositionNotFoundException()
        return PositionRead.model_validate(position)

    async def list(
        self,
        pagination: PaginationParams,
        search: PositionSearchParams,
    ) -> PositionListResponse:
        items, total = await self.repo.list(
            limit=pagination.limit,
            offset=pagination.offset,
            name=search.name,
            order=search.order,
        )
        return PositionListResponse.build(
            items=[PositionRead.model_validate(p) for p in items],
            total=total,
            pagination=pagination,
        )

    async def update(self, position_id: int, data: PositionUpdate) -> PositionRead:
        position = await self.repo.get_by_id(position_id)
        if not position:
            raise PositionNotFoundException()
        if data.name and data.name != position.name:
            if await self.repo.get_by_name(data.name) is not None:
                raise PositionAlreadyExistsException()
        position = await self.repo.update(position, data)
        return PositionRead.model_validate(position)

    async def delete(self, position_id: int) -> None:
        position = await self.repo.get_by_id(position_id)
        if not position:
            raise PositionNotFoundException()
        await self.repo.delete(position)
