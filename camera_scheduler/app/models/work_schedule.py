from datetime import time

from sqlalchemy import Integer, Time
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base
from .mixins.id_int_pk import IdIntPk
from .mixins.time_stamp_mixin import TimestampMixin


class WorkSchedule(Base, IdIntPk, TimestampMixin):
    """Mirror of sharq's work_schedule. Schema is owned by sharq's alembic."""

    __tablename__ = "work_schedule"

    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    late_threshold_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    early_leave_threshold_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
