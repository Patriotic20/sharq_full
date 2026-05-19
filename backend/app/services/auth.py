import jwt

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.exceptions.auth import (
    InactiveUserException,
    InvalidCredentialsException,
    InvalidTokenException,
    TokenExpiredException,
)
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.auth import TokenPair


class AuthService:
    def __init__(self, repo: UserRepository) -> None:
        self.repo = repo

    async def authenticate(self, username: str, password: str) -> TokenPair:
        user = await self.repo.get_by_username(username)
        if not user or not verify_password(password, user.hashed_password):
            raise InvalidCredentialsException()
        if not user.is_active:
            raise InactiveUserException()
        return self._issue_tokens(user)

    async def refresh(self, refresh_token: str) -> TokenPair:
        try:
            payload = decode_token(refresh_token, token_type="refresh")
        except jwt.ExpiredSignatureError:
            raise TokenExpiredException()
        except jwt.PyJWTError:
            raise InvalidTokenException()

        user_id = int(payload["sub"])
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise InvalidTokenException()
        if not user.is_active:
            raise InactiveUserException()
        return self._issue_tokens(user)

    @staticmethod
    def _issue_tokens(user: User) -> TokenPair:
        return TokenPair(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
        )
