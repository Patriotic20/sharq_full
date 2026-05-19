from app.core.security import hash_password
from app.exceptions.role import RoleNotFoundException
from app.exceptions.user import UserAlreadyExistsException, UserNotFoundException
from app.repositories.role import RoleRepository
from app.repositories.user import UserRepository
from app.schemas.common import PaginationParams
from app.schemas.user import (
    PasswordChange,
    UserCreate,
    UserListResponse,
    UserRead,
    UserSearchParams,
    UserUpdate,
)


class UserService:
    def __init__(self, repo: UserRepository, role_repo: RoleRepository) -> None:
        self.repo = repo
        self.role_repo = role_repo

    async def _ensure_role_exists(self, role_id: int | None) -> None:
        if role_id is None:
            return
        if await self.role_repo.get_by_id(role_id) is None:
            raise RoleNotFoundException()

    async def create(self, data: UserCreate) -> UserRead:
        if await self.repo.get_by_username(data.username) is not None:
            raise UserAlreadyExistsException()
        await self._ensure_role_exists(data.role_id)
        user = await self.repo.create(
            username=data.username,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
            is_active=data.is_active,
            role_id=data.role_id,
        )
        return UserRead.model_validate(user)

    async def get(self, user_id: int) -> UserRead:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundException()
        return UserRead.model_validate(user)

    async def list(
        self, pagination: PaginationParams, search: UserSearchParams
    ) -> UserListResponse:
        items, total = await self.repo.list(
            limit=pagination.limit,
            offset=pagination.offset,
            username=search.username,
            role_id=search.role_id,
            is_active=search.is_active,
        )
        return UserListResponse.build(
            items=[UserRead.model_validate(u) for u in items],
            total=total,
            pagination=pagination,
        )

    async def update(self, user_id: int, data: UserUpdate) -> UserRead:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundException()

        fields = data.model_dump(exclude_unset=True)
        if "username" in fields and fields["username"] != user.username:
            if await self.repo.get_by_username(fields["username"]) is not None:
                raise UserAlreadyExistsException()
        if "role_id" in fields:
            await self._ensure_role_exists(fields["role_id"])

        user = await self.repo.update(user, fields)
        refreshed = await self.repo.get_by_id(user.id)
        return UserRead.model_validate(refreshed)

    async def change_password(self, user_id: int, data: PasswordChange) -> None:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundException()
        await self.repo.update(user, {"hashed_password": hash_password(data.new_password)})

    async def delete(self, user_id: int) -> None:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundException()
        await self.repo.delete(user)
