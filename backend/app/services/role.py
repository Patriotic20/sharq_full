from app.exceptions.role import (
    RoleAlreadyExistsException,
    RoleInUseException,
    RoleNotFoundException,
)
from app.repositories.role import RoleRepository
from app.schemas.common import PaginationParams
from app.schemas.permission import PermissionRead
from app.schemas.role import (
    RoleCreate,
    RoleListResponse,
    RoleRead,
    RoleUpdate,
    RoleWithPermissionsRead,
)


class RoleService:
    def __init__(self, repo: RoleRepository) -> None:
        self.repo = repo

    async def create(self, data: RoleCreate) -> RoleRead:
        if await self.repo.get_by_name(data.name) is not None:
            raise RoleAlreadyExistsException()
        role = await self.repo.create(data)
        return RoleRead.model_validate(role)

    async def get(self, role_id: int) -> RoleRead:
        role = await self.repo.get_by_id(role_id)
        if not role:
            raise RoleNotFoundException()
        return RoleRead.model_validate(role)

    async def get_with_permissions(self, role_id: int) -> RoleWithPermissionsRead:
        role = await self.repo.get_with_permissions(role_id)
        if not role:
            raise RoleNotFoundException()
        return RoleWithPermissionsRead(
            id=role.id,
            name=role.name,
            description=role.description,
            created_at=role.created_at,
            updated_at=role.updated_at,
            permissions=[PermissionRead.model_validate(p) for p in role.permissions],
        )

    async def list(self, pagination: PaginationParams) -> RoleListResponse:
        items, total = await self.repo.list(
            limit=pagination.limit, offset=pagination.offset
        )
        return RoleListResponse.build(
            items=[RoleRead.model_validate(r) for r in items],
            total=total,
            pagination=pagination,
        )

    async def update(self, role_id: int, data: RoleUpdate) -> RoleRead:
        role = await self.repo.get_by_id(role_id)
        if not role:
            raise RoleNotFoundException()
        if data.name and data.name != role.name:
            if await self.repo.get_by_name(data.name) is not None:
                raise RoleAlreadyExistsException()
        role = await self.repo.update(role, data)
        return RoleRead.model_validate(role)

    async def delete(self, role_id: int) -> None:
        role = await self.repo.get_by_id(role_id)
        if not role:
            raise RoleNotFoundException()
        if await self.repo.count_users(role_id) > 0:
            raise RoleInUseException()
        await self.repo.delete(role)
