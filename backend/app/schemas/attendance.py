from math import ceil
from datetime import date as DateType, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.enums.attendance import AttendanceStatus, PresenceStatus
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


class AttendanceFilterParams(BaseModel):
    date: DateType | None = None
    employee_id: int | None = None
    status: AttendanceStatus | None = None
    presence_status: PresenceStatus | None = None


class EmployeeBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    first_name: str
    last_name: str
    middle_name: str


class CameraBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ip_address: str


class AttendanceUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    status: AttendanceStatus | None = None
    presence_status: PresenceStatus | None = None
    enter_time: datetime | None = None
    exit_time: datetime | None = None
    enter_camera_id: int | None = None
    exit_camera_id: int | None = None


class AttendanceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: int
    employee: EmployeeBrief
    enter_time: datetime | None
    enter_camera: CameraBrief | None
    enter_rec_no: int | None
    exit_time: datetime | None
    exit_camera: CameraBrief | None
    exit_rec_no: int | None
    status: AttendanceStatus
    presence_status: PresenceStatus | None
    created_at: datetime
    updated_at: datetime


class AttendanceListResponse(BaseModel):
    items: list[AttendanceRead]
    total: int
    page: int
    size: int
    pages: int

    @classmethod
    def build(
        cls,
        items: list[AttendanceRead],
        total: int,
        pagination: PaginationParams,
    ) -> "AttendanceListResponse":
        return cls(
            items=items,
            total=total,
            page=pagination.page,
            size=pagination.size,
            pages=ceil(total / pagination.size) if total else 0,
        )
