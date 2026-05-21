from datetime import time

from sqlalchemy import Boolean, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base
from .mixins.id_int_pk import IdIntPk
from .mixins.time_stamp_mixin import TimestampMixin


class WorkSchedule(Base, IdIntPk, TimestampMixin):
    """Mirror of sharq's work_schedule. Schema is owned by sharq's alembic."""

    __tablename__ = "work_schedule"

    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    late_threshold_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    early_leave_threshold_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    applies_to_all: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
