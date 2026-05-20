from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_session, require_permission
from app.exceptions.role import RoleNotFoundException
from app.exceptions.user import (
    DatabaseException,
    UserAlreadyExistsException,
    UserNotFoundException,
)
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
from app.services.user import UserService

router = APIRouter(prefix="/users", tags=["users"])


def get_user_service(session: AsyncSession = Depends(get_session)) -> UserService:
    return UserService(UserRepository(session), RoleRepository(session))


def _handle(
    exc: UserNotFoundException
    | UserAlreadyExistsException
    | RoleNotFoundException
    | DatabaseException,
) -> None:
    raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.post(
    "/",
    response_model=UserRead,
    status_code=201,
    dependencies=[Depends(require_permission("users:write"))],
)
async def create_user(
    data: UserCreate,
    service: UserService = Depends(get_user_service),
) -> UserRead:
    try:
        return await service.create(data)
    except (UserAlreadyExistsException, RoleNotFoundException, DatabaseException) as e:
        _handle(e)


@router.get(
    "/",
    response_model=UserListResponse,
    dependencies=[Depends(require_permission("users:read"))],
)
async def list_users(
    page: int = 1,
    size: int = 10,
    username: str | None = None,
    role_id: int | None = None,
    is_active: bool | None = None,
    service: UserService = Depends(get_user_service),
) -> UserListResponse:
    pagination = PaginationParams(page=page, size=size)
    search = UserSearchParams(username=username, role_id=role_id, is_active=is_active)
    return await service.list(pagination, search)


@router.get(
    "/{user_id}",
    response_model=UserRead,
    dependencies=[Depends(require_permission("users:read"))],
)
async def get_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
) -> UserRead:
    try:
        return await service.get(user_id)
    except UserNotFoundException as e:
        _handle(e)


@router.patch(
    "/{user_id}",
    response_model=UserRead,
    dependencies=[Depends(require_permission("users:update"))],
)
async def update_user(
    user_id: int,
    data: UserUpdate,
    service: UserService = Depends(get_user_service),
) -> UserRead:
    try:
        return await service.update(user_id, data)
    except (UserNotFoundException, UserAlreadyExistsException, RoleNotFoundException, DatabaseException) as e:
        _handle(e)


@router.post(
    "/{user_id}/password",
    status_code=204,
    dependencies=[Depends(require_permission("users:update"))],
)
async def change_password(
    user_id: int,
    data: PasswordChange,
    service: UserService = Depends(get_user_service),
) -> None:
    try:
        await service.change_password(user_id, data)
    except (UserNotFoundException, DatabaseException) as e:
        _handle(e)


@router.delete(
    "/{user_id}",
    status_code=204,
    dependencies=[Depends(require_permission("users:delete"))],
)
async def delete_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
) -> None:
    try:
        await service.delete(user_id)
    except (UserNotFoundException, DatabaseException) as e:
        _handle(e)
