from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.enums.employee import Gender

from .base import Base
from .mixins.id_int_pk import IdIntPk
from .mixins.time_stamp_mixin import TimestampMixin


class EmployeeInfo(Base, IdIntPk, TimestampMixin):
    __tablename__ = "employe_info"

    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    full_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    nationality: Mapped[str | None] = mapped_column(String(50), nullable=True)
    gender: Mapped[Gender | None] = mapped_column(
        Enum(
            Gender,
            values_callable=lambda obj: [m.value for m in obj],
            name="gender",
        ),
        nullable=True,
    )
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    birth_place: Mapped[str | None] = mapped_column(Text, nullable=True)
    residence_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    education: Mapped[str | None] = mapped_column(String(50), nullable=True)
    graduated_from: Mapped[str | None] = mapped_column(String(255), nullable=True)
    scientific_degree: Mapped[str | None] = mapped_column(String(100), nullable=True)
    scientific_title: Mapped[str | None] = mapped_column(String(100), nullable=True)
    work_experience: Mapped[str | None] = mapped_column(Text, nullable=True)

    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    position_id: Mapped[int | None] = mapped_column(
        ForeignKey("positions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    employment_rate: Mapped[Decimal | None] = mapped_column(
        Numeric(3, 2), nullable=True
    )
    state_awards: Mapped[str | None] = mapped_column(Text, nullable=True)
    foreign_languages: Mapped[str | None] = mapped_column(String(255), nullable=True)
    party_membership: Mapped[str | None] = mapped_column(String(100), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(32), nullable=True)

    employee = relationship("Employee", back_populates="info", lazy="joined")
    department = relationship("Department", lazy="joined")
    position = relationship("Position", back_populates="employee_infos", lazy="joined")
