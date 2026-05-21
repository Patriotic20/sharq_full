from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class WorkScheduleDepartment(Base):
    __tablename__ = "work_schedule_departments"
    __table_args__ = (
        UniqueConstraint("department_id", name="uq_work_schedule_departments_department_id"),
    )

    work_schedule_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("work_schedule.id", ondelete="CASCADE"),
        primary_key=True,
    )
    department_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("departments.id", ondelete="CASCADE"),
        primary_key=True,
    )
