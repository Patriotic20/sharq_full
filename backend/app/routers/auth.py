from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_active_user, get_session
from app.exceptions.auth import (
    InactiveUserException,
    InvalidCredentialsException,
    InvalidTokenException,
    TokenExpiredException,
)
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.auth import MeResponse, RefreshRequest, TokenPair
from app.schemas.user import UserRead
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service(session: AsyncSession = Depends(get_session)) -> AuthService:
    return AuthService(UserRepository(session))


def _handle(
    exc: InvalidCredentialsException
    | InvalidTokenException
    | TokenExpiredException
    | InactiveUserException,
) -> None:
    raise HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.post("/login", response_model=TokenPair)
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    service: AuthService = Depends(get_auth_service),
) -> TokenPair:
    try:
        return await service.authenticate(form.username, form.password)
    except (InvalidCredentialsException, InactiveUserException) as e:
        _handle(e)


@router.post("/refresh", response_model=TokenPair)
async def refresh(
    body: RefreshRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenPair:
    try:
        return await service.refresh(body.refresh_token)
    except (InvalidTokenException, TokenExpiredException, InactiveUserException) as e:
        _handle(e)


@router.get("/me", response_model=MeResponse)
async def me(user: User = Depends(get_current_active_user)) -> MeResponse:
    permissions = sorted({p.code for p in user.role.permissions}) if user.role else []
    return MeResponse(user=UserRead.model_validate(user), permissions=permissions)
