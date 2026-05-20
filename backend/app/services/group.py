from app.exceptions.group import (
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


class GroupService:
    def __init__(self, repo: GroupRepository) -> None:
        self.repo = repo

    async def create(self, data: GroupCreate) -> GroupRead:
        if await self.repo.get_by_name(data.name) is not None:
            raise GroupAlreadyExistsException()
        group = await self.repo.create(data)
        return GroupRead.model_validate(group)

    async def get(self, group_id: int) -> GroupRead:
        group = await self.repo.get_by_id(group_id)
        if not group:
            raise GroupNotFoundException()
        return GroupRead.model_validate(group)

    async def list(
        self,
        pagination: PaginationParams,
        search: GroupSearchParams,
    ) -> GroupListResponse:
        items, total = await self.repo.list(
            limit=pagination.limit,
            offset=pagination.offset,
            name=search.name,
            order=search.order,
        )
        return GroupListResponse.build(
            items=[GroupRead.model_validate(g) for g in items],
            total=total,
            pagination=pagination,
        )

    async def update(self, group_id: int, data: GroupUpdate) -> GroupRead:
        group = await self.repo.get_by_id(group_id)
        if not group:
            raise GroupNotFoundException()
        if data.name and data.name != group.name:
            if await self.repo.get_by_name(data.name) is not None:
                raise GroupAlreadyExistsException()
        group = await self.repo.update(group, data)
        return GroupRead.model_validate(group)

    async def delete(self, group_id: int) -> None:
        group = await self.repo.get_by_id(group_id)
        if not group:
            raise GroupNotFoundException()
        await self.repo.delete(group)
