from datetime import datetime

from .base import Base
from .mixins.id_int_pk import IdIntPk
from .mixins.time_stamp_mixin import TimestampMixin
from sqlalchemy import DateTime, ForeignKey, Index, Integer, Enum

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.enums.attendance import AttendanceStatus, LeaveType, PresenceStatus

class Attendance(Base, IdIntPk, TimestampMixin):
    __tablename__ = "attendances"
    __table_args__ = (
        Index("ix_att_enter_time_status", "enter_time", "status"),
    )

    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id"), nullable=False, index=True
    )

    # Вход
    enter_camera_id: Mapped[int | None] = mapped_column(
        ForeignKey("cameras.id"), nullable=True
    )
    enter_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    enter_rec_no: Mapped[int | None] = mapped_column(
        Integer, nullable=True, index=True
    )

    # Выход
    exit_camera_id: Mapped[int | None] = mapped_column(
        ForeignKey("cameras.id"), nullable=True
    )
    exit_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    exit_rec_no: Mapped[int | None] = mapped_column(
        Integer, nullable=True, index=True
    )

    status: Mapped[AttendanceStatus] = mapped_column(
        Enum(AttendanceStatus), nullable=False, index=True
    )

    presence_status: Mapped[PresenceStatus | None] = mapped_column(
        Enum(PresenceStatus), nullable=True, index=True
    )

    leave_type: Mapped[LeaveType | None] = mapped_column(
        Enum(LeaveType, values_callable=lambda obj: [m.value for m in obj]),
        nullable=True,
        index=True,
    )

    worked_seconds: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )

    employee = relationship("Employee", back_populates="attendances")
    enter_camera = relationship("Camera", foreign_keys=[enter_camera_id])
    exit_camera = relationship("Camera", foreign_keys=[exit_camera_id])
    events = relationship(
        "AttendanceEvent",
        back_populates="attendance",
        cascade="all, delete-orphan",
        order_by="AttendanceEvent.event_time",
        lazy="selectin",
    )
