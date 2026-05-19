from app.exceptions.permission import PermissionNotFoundException
from app.exceptions.role import RoleNotFoundException
from app.repositories.permission import PermissionRepository
from app.repositories.role import RoleRepository
from app.repositories.role_permission import RolePermissionRepository
from app.schemas.permission import PermissionRead
from app.schemas.role import RoleWithPermissionsRead


class RolePermissionService:
    def __init__(
        self,
        role_repo: RoleRepository,
        permission_repo: PermissionRepository,
        link_repo: RolePermissionRepository,
    ) -> None:
        self.role_repo = role_repo
        self.permission_repo = permission_repo
        self.link_repo = link_repo

    async def _ensure_role(self, role_id: int) -> None:
        if await self.role_repo.get_by_id(role_id) is None:
            raise RoleNotFoundException()

    async def _validate_permissions(self, permission_ids: list[int]) -> None:
        if not permission_ids:
            return
        found = await self.permission_repo.get_by_ids(permission_ids)
        if len(found) != len(set(permission_ids)):
            raise PermissionNotFoundException()

    async def _build_response(self, role_id: int) -> RoleWithPermissionsRead:
        role = await self.role_repo.get_with_permissions(role_id)
        assert role is not None
        return RoleWithPermissionsRead(
            id=role.id,
            name=role.name,
            description=role.description,
            created_at=role.created_at,
            updated_at=role.updated_at,
            permissions=[PermissionRead.model_validate(p) for p in role.permissions],
        )

    async def assign(self, role_id: int, permission_ids: list[int]) -> RoleWithPermissionsRead:
        await self._ensure_role(role_id)
        await self._validate_permissions(permission_ids)
        await self.link_repo.assign(role_id, permission_ids)
        return await self._build_response(role_id)

    async def revoke(self, role_id: int, permission_ids: list[int]) -> RoleWithPermissionsRead:
        await self._ensure_role(role_id)
        await self.link_repo.revoke(role_id, permission_ids)
        return await self._build_response(role_id)

    async def replace(self, role_id: int, permission_ids: list[int]) -> RoleWithPermissionsRead:
        await self._ensure_role(role_id)
        await self._validate_permissions(permission_ids)
        await self.link_repo.replace(role_id, permission_ids)
        return await self._build_response(role_id)
