from .base import Base
from .mixins.id_int_pk import IdIntPk
from .mixins.time_stamp_mixin import TimestampMixin

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Employee(Base, IdIntPk, TimestampMixin):
    __tablename__ = "employees"

    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    middle_name: Mapped[str] = mapped_column(String(50), nullable=False)

    camera_user_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True, index=True
    )

    attendances = relationship("Attendance", back_populates="employee")
