from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import PaginationParams, build_pages


class PositionCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=150)


class PositionUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=1, max_length=150)


class PositionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    created_at: datetime
    updated_at: datetime


class PositionBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class PositionSearchParams(BaseModel):
    name: str | None = None
    order: Literal["asc", "desc"] = "desc"


class PositionListResponse(BaseModel):
    items: list[PositionRead]
    total: int
    page: int
    size: int
    pages: int

    @classmethod
    def build(
        cls,
        items: list[PositionRead],
        total: int,
        pagination: PaginationParams,
    ) -> "PositionListResponse":
        return cls(
            items=items,
            total=total,
            page=pagination.page,
            size=pagination.size,
            pages=build_pages(total, pagination.size),
        )
