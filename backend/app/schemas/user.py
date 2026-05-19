from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import PaginationParams, build_pages
from app.schemas.role import RoleRead


class UserCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6, max_length=128)
    full_name: str | None = Field(default=None, max_length=150)
    is_active: bool = True
    role_id: int | None = None


class UserUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    username: str | None = Field(default=None, min_length=3, max_length=50)
    full_name: str | None = Field(default=None, max_length=150)
    is_active: bool | None = None
    role_id: int | None = None


class PasswordChange(BaseModel):
    new_password: str = Field(min_length=6, max_length=128)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str | None
    is_active: bool
    role_id: int | None
    role: RoleRead | None
    created_at: datetime
    updated_at: datetime


class UserSearchParams(BaseModel):
    username: str | None = None
    role_id: int | None = None
    is_active: bool | None = None


class UserListResponse(BaseModel):
    items: list[UserRead]
    total: int
    page: int
    size: int
    pages: int

    @classmethod
    def build(
        cls,
        items: list[UserRead],
        total: int,
        pagination: PaginationParams,
    ) -> "UserListResponse":
        return cls(
            items=items,
            total=total,
            page=pagination.page,
            size=pagination.size,
            pages=build_pages(total, pagination.size),
        )
