from .base import Base
from .mixins.id_int_pk import IdIntPk
from .mixins.time_stamp_mixin import TimestampMixin

from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Employee(Base, IdIntPk, TimestampMixin):
    __tablename__ = "employees"

    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    middle_name: Mapped[str] = mapped_column(String(50), nullable=False)

    camera_user_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True, index=True
    )

    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    employment_rate: Mapped[Decimal] = mapped_column(
        Numeric(3, 2), nullable=False, server_default="1.00"
    )
    position_id: Mapped[int | None] = mapped_column(
        ForeignKey("positions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    department = relationship("Department", back_populates="employees", lazy="joined")
    position = relationship("Position", back_populates="employees", lazy="joined")
    attendances = relationship("Attendance", back_populates="employee")
    info = relationship(
        "EmployeeInfo",
        back_populates="employee",
        uselist=False,
        cascade="all, delete-orphan",
    )
