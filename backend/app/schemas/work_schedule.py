from datetime import datetime, time
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.common import PaginationParams, build_pages


class DepartmentRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class GroupRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class WorkScheduleCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=100)
    start_time: time
    end_time: time
    late_threshold_minutes: int = Field(default=0, ge=0)
    early_leave_threshold_minutes: int = Field(default=0, ge=0)
    applies_to_all: bool = False
    department_ids: list[int] = Field(default_factory=list)
    group_ids: list[int] = Field(default_factory=list)

    @model_validator(mode="after")
    def _check_times(self) -> "WorkScheduleCreate":
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class WorkScheduleUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=1, max_length=100)
    start_time: time | None = None
    end_time: time | None = None
    late_threshold_minutes: int | None = Field(default=None, ge=0)
    early_leave_threshold_minutes: int | None = Field(default=None, ge=0)
    applies_to_all: bool | None = None
    department_ids: list[int] | None = None
    group_ids: list[int] | None = None

    @model_validator(mode="after")
    def _check_times(self) -> "WorkScheduleUpdate":
        if self.start_time is not None and self.end_time is not None:
            if self.end_time <= self.start_time:
                raise ValueError("end_time must be after start_time")
        return self


class WorkScheduleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    start_time: time
    end_time: time
    late_threshold_minutes: int
    early_leave_threshold_minutes: int
    applies_to_all: bool
    departments: list[DepartmentRef] = Field(default_factory=list)
    groups: list[GroupRef] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class WorkScheduleSearchParams(BaseModel):
    name: str | None = None
    order: Literal["asc", "desc"] = "desc"


class WorkScheduleListResponse(BaseModel):
    items: list[WorkScheduleRead]
    total: int
    page: int
    size: int
    pages: int

    @classmethod
    def build(
        cls,
        items: list[WorkScheduleRead],
        total: int,
        pagination: PaginationParams,
    ) -> "WorkScheduleListResponse":
        return cls(
            items=items,
            total=total,
            page=pagination.page,
            size=pagination.size,
            pages=build_pages(total, pagination.size),
        )


class RecomputeResult(BaseModel):
    updated: int
