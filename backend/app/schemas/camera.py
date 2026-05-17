from math import ceil
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.enums.camera import CameraType


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    size: int = Field(default=10, ge=1, le=100)

    @property
    def limit(self) -> int:
        return self.size

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.size


class CameraSearchParams(BaseModel):
    ip_address: str | None = None
    login: str | None = None
    type: CameraType | None = None


class CameraCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    ip_address: str = Field(min_length=7, max_length=50)
    login: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=100)
    type: CameraType


class CameraUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    ip_address: str | None = Field(default=None, min_length=7, max_length=50)
    login: str | None = Field(default=None, min_length=1, max_length=50)
    password: str | None = Field(default=None, min_length=1, max_length=100)
    type: CameraType | None = None


class CameraRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ip_address: str
    login: str
    type: CameraType
    created_at: datetime
    updated_at: datetime


class CameraListResponse(BaseModel):
    items: list[CameraRead]
    total: int
    page: int
    size: int
    pages: int

    @classmethod
    def build(
        cls,
        items: list[CameraRead],
        total: int,
        pagination: PaginationParams,
    ) -> "CameraListResponse":
        return cls(
            items=items,
            total=total,
            page=pagination.page,
            size=pagination.size,
            pages=ceil(total / pagination.size) if total else 0,
        )
