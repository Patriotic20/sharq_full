from datetime import date as DateType

from pydantic import BaseModel, ConfigDict


class TabelDayCellRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: DateType
    code: str
    is_holiday: bool
    is_weekend: bool
    attendance_id: int | None
    status: str | None
    leave_type: str | None


class TabelEmployeeRowRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    employee_id: int
    full_name: str
    position: str | None
    employment_rate: float
    days: list[TabelDayCellRead]
    worked_days: int


class TabelDataResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    year: int
    month: int
    month_name: str
    days_in_month: int
    working_days: int
    org_name: str
    rector_name: str
    kafedra_name: str
    holiday_dates: list[DateType]
    employees: list[TabelEmployeeRowRead]
