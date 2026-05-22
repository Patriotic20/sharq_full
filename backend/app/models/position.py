from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .mixins.id_int_pk import IdIntPk
from .mixins.time_stamp_mixin import TimestampMixin


class Position(Base, IdIntPk, TimestampMixin):
    __tablename__ = "positions"

    name: Mapped[str] = mapped_column(
        String(150), unique=True, nullable=False, index=True
    )

    employees = relationship("Employee", back_populates="position")
    employee_infos = relationship("EmployeeInfo", back_populates="position")
