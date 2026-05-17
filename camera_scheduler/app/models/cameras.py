from .base import Base
from .mixins.id_int_pk import IdIntPk
from .mixins.time_stamp_mixin import TimestampMixin


from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from enum import Enum as PyEnum

class CameraType(str, PyEnum):
    ENTER = "enter"
    EXIT = "exit"


class Camera(Base, IdIntPk, TimestampMixin):
    __tablename__ = "cameras"

    ip_address: Mapped[str] = mapped_column(String(50), nullable=False)
    login: Mapped[str] = mapped_column(String(50), nullable=False)
    password: Mapped[str] = mapped_column(String(100), nullable=False)
    
    type: Mapped[CameraType] = mapped_column(
        Enum(CameraType, values_callable=lambda x: [e.value for e in x], name="camera_type"),
        nullable=False,
    )