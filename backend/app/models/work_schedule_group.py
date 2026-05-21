from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class WorkScheduleGroup(Base):
    __tablename__ = "work_schedule_groups"
    __table_args__ = (
        UniqueConstraint("group_id", name="uq_work_schedule_groups_group_id"),
    )

    work_schedule_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("work_schedule.id", ondelete="CASCADE"),
        primary_key=True,
    )
    group_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("groups.id", ondelete="CASCADE"),
        primary_key=True,
    )
