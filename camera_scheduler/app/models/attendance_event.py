from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.enums.camera import CameraType

from .base import Base
from .mixins.id_int_pk import IdIntPk
from .mixins.time_stamp_mixin import TimestampMixin


class AttendanceEvent(Base, IdIntPk, TimestampMixin):
    """Mirror of sharq's attendance_events. Schema owned by sharq's alembic."""

    __tablename__ = "attendance_events"
    __table_args__ = (
        UniqueConstraint(
            "camera_id", "rec_no", name="uq_attendance_events_cam_rec"
        ),
        Index("ix_attendance_events_att_time", "attendance_id", "event_time"),
    )

    attendance_id: Mapped[int] = mapped_column(
        ForeignKey("attendances.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[CameraType] = mapped_column(
        Enum(
            CameraType,
            name="cameratype",
            create_type=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
    )
    event_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    camera_id: Mapped[int] = mapped_column(
        ForeignKey("cameras.id"), nullable=False
    )
    rec_no: Mapped[int] = mapped_column(Integer, nullable=False)

    attendance = relationship("Attendance", back_populates="events")
    camera = relationship("Camera")
