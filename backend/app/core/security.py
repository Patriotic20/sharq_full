from datetime import datetime, timedelta, timezone
from typing import Any, Literal

import bcrypt
import jwt

from app.core.config import settings

TokenType = Literal["access", "refresh"]

_BCRYPT_MAX_BYTES = 72


def _encode_password(plain: str) -> bytes:
    return plain.encode("utf-8")[:_BCRYPT_MAX_BYTES]


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(_encode_password(plain), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_encode_password(plain), hashed.encode("utf-8"))
    except ValueError:
        return False


def _create_token(
    subject: str | int,
    token_type: TokenType,
    expires_delta: timedelta,
    secret: str,
    extra: dict[str, Any] | None = None,
) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, secret, algorithm=settings.jwt.algorithm)


def create_access_token(subject: str | int, extra: dict[str, Any] | None = None) -> str:
    return _create_token(
        subject=subject,
        token_type="access",
        expires_delta=timedelta(minutes=settings.jwt.access_token_expires_minutes),
        secret=settings.jwt.access_token_secret,
        extra=extra,
    )


def create_refresh_token(subject: str | int) -> str:
    return _create_token(
        subject=subject,
        token_type="refresh",
        expires_delta=timedelta(days=settings.jwt.refresh_token_expires_days),
        secret=settings.jwt.refresh_token_secret,
    )


def decode_token(token: str, token_type: TokenType) -> dict[str, Any]:
    secret = (
        settings.jwt.access_token_secret
        if token_type == "access"
        else settings.jwt.refresh_token_secret
    )
    payload = jwt.decode(token, secret, algorithms=[settings.jwt.algorithm])
    if payload.get("type") != token_type:
        raise jwt.InvalidTokenError("Wrong token type")
    return payload
