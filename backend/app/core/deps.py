from typing import AsyncGenerator

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import db_helper
from app.core.security import decode_token
from app.exceptions.auth import (
    InactiveUserException,
    InvalidTokenException,
    PermissionDeniedException,
    TokenExpiredException,
)
from app.exceptions.base import BaseAppException
from app.models.user import User
from app.repositories.user import UserRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async for session in db_helper.session_getter():
        yield session


def _raise(exc: BaseAppException) -> None:
    raise HTTPException(status_code=exc.status_code, detail=exc.detail)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    try:
        payload = decode_token(token, token_type="access")
    except jwt.ExpiredSignatureError:
        _raise(TokenExpiredException())
    except jwt.PyJWTError:
        _raise(InvalidTokenException())

    user_id = int(payload["sub"])
    user = await UserRepository(session).get_by_id(user_id)
    if not user:
        _raise(InvalidTokenException())
    return user  # type: ignore[return-value]


async def get_current_active_user(
    user: User = Depends(get_current_user),
) -> User:
    if not user.is_active:
        _raise(InactiveUserException())
    return user


def _user_permission_codes(user: User) -> set[str]:
    if user.role is None:
        return set()
    return {p.code for p in user.role.permissions}


def require_permission(code: str):
    async def _checker(
        user: User = Depends(get_current_active_user),
    ) -> User:
        if code not in _user_permission_codes(user):
            _raise(PermissionDeniedException())
        return user

    return _checker
