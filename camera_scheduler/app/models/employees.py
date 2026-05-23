from .base import Base
from .mixins.id_int_pk import IdIntPk
from .mixins.time_stamp_mixin import TimestampMixin

from sqlalchemy import Enum as SAEnum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.enums.employee_status import EmployeeStatus


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

    status: Mapped[EmployeeStatus | None] = mapped_column(
        SAEnum(
            EmployeeStatus,
            name="employeestatus",
            create_type=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=True,
        index=True,
    )

    attendances = relationship("Attendance", back_populates="employee")
