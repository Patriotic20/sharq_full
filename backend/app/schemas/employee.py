from math import ceil
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    size: int = Field(default=10, ge=1, le=100)

    @property
    def limit(self) -> int:
        return self.size

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.size


class EmployeeSearchParams(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    camera_user_id: str | None = None


class EmployeeCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    first_name: str = Field(min_length=1, max_length=50)
    last_name: str = Field(min_length=1, max_length=50)
    middle_name: str = Field(min_length=1, max_length=50)
    camera_user_id: str | None = Field(default=None, max_length=50)


class EmployeeUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    first_name: str | None = Field(default=None, min_length=1, max_length=50)
    last_name: str | None = Field(default=None, min_length=1, max_length=50)
    middle_name: str | None = Field(default=None, min_length=1, max_length=50)
    camera_user_id: str | None = Field(default=None, max_length=50)


class EmployeeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    middle_name: str
    camera_user_id: str | None
    created_at: datetime
    updated_at: datetime


class EmployeeListResponse(BaseModel):
    items: list[EmployeeRead]
    total: int
    page: int
    size: int
    pages: int

    @classmethod
    def build(
        cls,
        items: list[EmployeeRead],
        total: int,
        pagination: PaginationParams,
    ) -> "EmployeeListResponse":
        return cls(
            items=items,
            total=total,
            page=pagination.page,
            size=pagination.size,
            pages=ceil(total / pagination.size) if total else 0,
        )
