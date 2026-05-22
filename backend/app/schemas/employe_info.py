from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.enums.employee import Gender
from app.schemas.common import PaginationParams, build_pages
from app.schemas.department import DepartmentBrief
from app.schemas.position import PositionBrief


class EmployeeInfoSearchParams(BaseModel):
    full_name: str | None = None
    department_id: int | None = None
    employee_id: int | None = None
    order: Literal["asc", "desc"] = "desc"


class EmployeeInfoCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    employee_id: int
    full_name: str = Field(min_length=1, max_length=200)
    nationality: str | None = Field(default=None, max_length=50)
    gender: Gender | None = None
    birth_date: date | None = None
    birth_place: str | None = None
    residence_address: str | None = None
    education: str | None = Field(default=None, max_length=50)
    graduated_from: str | None = Field(default=None, max_length=255)
    scientific_degree: str | None = Field(default=None, max_length=100)
    scientific_title: str | None = Field(default=None, max_length=100)
    work_experience: str | None = None
    department_id: int | None = None
    position_id: int | None = None
    employment_rate: Decimal | None = Field(default=None, ge=0, le=9.99)
    state_awards: str | None = None
    foreign_languages: str | None = Field(default=None, max_length=255)
    party_membership: str | None = Field(default=None, max_length=100)
    email: str | None = Field(default=None, max_length=255)
    phone_number: str | None = Field(default=None, max_length=32)


class EmployeeInfoUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    nationality: str | None = Field(default=None, max_length=50)
    gender: Gender | None = None
    birth_date: date | None = None
    birth_place: str | None = None
    residence_address: str | None = None
    education: str | None = Field(default=None, max_length=50)
    graduated_from: str | None = Field(default=None, max_length=255)
    scientific_degree: str | None = Field(default=None, max_length=100)
    scientific_title: str | None = Field(default=None, max_length=100)
    work_experience: str | None = None
    department_id: int | None = None
    position_id: int | None = None
    employment_rate: Decimal | None = Field(default=None, ge=0, le=9.99)
    state_awards: str | None = None
    foreign_languages: str | None = Field(default=None, max_length=255)
    party_membership: str | None = Field(default=None, max_length=100)
    email: str | None = Field(default=None, max_length=255)
    phone_number: str | None = Field(default=None, max_length=32)


class EmployeeInfoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: int
    full_name: str
    nationality: str | None = None
    gender: Gender | None = None
    birth_date: date | None = None
    birth_place: str | None = None
    residence_address: str | None = None
    education: str | None = None
    graduated_from: str | None = None
    scientific_degree: str | None = None
    scientific_title: str | None = None
    work_experience: str | None = None
    department_id: int | None = None
    department: DepartmentBrief | None = None
    position_id: int | None = None
    position: PositionBrief | None = None
    employment_rate: Decimal | None = None
    state_awards: str | None = None
    foreign_languages: str | None = None
    party_membership: str | None = None
    email: str | None = None
    phone_number: str | None = None
    created_at: datetime
    updated_at: datetime


class EmployeeInfoListResponse(BaseModel):
    items: list[EmployeeInfoRead]
    total: int
    page: int
    size: int
    pages: int

    @classmethod
    def build(
        cls,
        items: list[EmployeeInfoRead],
        total: int,
        pagination: PaginationParams,
    ) -> "EmployeeInfoListResponse":
        return cls(
            items=items,
            total=total,
            page=pagination.page,
            size=pagination.size,
            pages=build_pages(total, pagination.size),
        )
