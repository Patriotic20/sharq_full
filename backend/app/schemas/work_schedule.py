from datetime import datetime, time

from pydantic import BaseModel, ConfigDict, Field, model_validator


class WorkScheduleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    start_time: time
    end_time: time
    late_threshold_minutes: int
    early_leave_threshold_minutes: int
    created_at: datetime
    updated_at: datetime


class WorkScheduleUpdate(BaseModel):
    start_time: time | None = None
    end_time: time | None = None
    late_threshold_minutes: int | None = Field(default=None, ge=0)
    early_leave_threshold_minutes: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def _check_times(self) -> "WorkScheduleUpdate":
        if self.start_time is not None and self.end_time is not None:
            if self.end_time <= self.start_time:
                raise ValueError("end_time must be after start_time")
        return self


class RecomputeResult(BaseModel):
    updated: int
