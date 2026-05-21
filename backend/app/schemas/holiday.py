from datetime import date as DateType, datetime
from math import ceil

from pydantic import BaseModel, ConfigDict, Field


class HolidayCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    date: DateType
    name: str = Field(min_length=1, max_length=120)
    is_recurring: bool = False


class HolidayUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    date: DateType | None = None
    name: str | None = Field(default=None, min_length=1, max_length=120)
    is_recurring: bool | None = None


class HolidayRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date: DateType
    name: str
    is_recurring: bool
    created_at: datetime
    updated_at: datetime


class HolidayListResponse(BaseModel):
    items: list[HolidayRead]
    total: int
    page: int
    size: int
    pages: int

    @classmethod
    def build(
        cls,
        items: list[HolidayRead],
        total: int,
        page: int,
        size: int,
    ) -> "HolidayListResponse":
        return cls(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=ceil(total / size) if total else 0,
        )
