from math import ceil
from datetime import date as DateType, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.enums.attendance import AttendanceStatus, LeaveType, PresenceStatus
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
    date_from: DateType | None = None
    date_to: DateType | None = None
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


class AttendanceEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: CameraType
    event_time: datetime
    camera: CameraBrief | None
    rec_no: int


class AttendanceUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    status: AttendanceStatus | None = None
    presence_status: PresenceStatus | None = None
    leave_type: LeaveType | None = None
    enter_time: datetime | None = None
    exit_time: datetime | None = None
    enter_camera_id: int | None = None
    exit_camera_id: int | None = None


class AttendanceCreate(BaseModel):
    """Manual creation of an attendance record for a given employee+date.

    `date` anchors the row to a calendar day; the service stores it as
    `enter_time = date at 12:00 in the configured app timezone` so the same
    date-range queries used elsewhere find it.
    """
    model_config = ConfigDict(str_strip_whitespace=True)

    employee_id: int
    date: DateType
    status: AttendanceStatus
    leave_type: LeaveType | None = None


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
    leave_type: LeaveType | None = None
    worked_seconds: int = 0
    events: list[AttendanceEventRead] = Field(default_factory=list)
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
