from datetime import date as DateType

from sqlalchemy import Boolean, Date, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base
from .mixins.id_int_pk import IdIntPk
from .mixins.time_stamp_mixin import TimestampMixin


class Holiday(Base, IdIntPk, TimestampMixin):
    __tablename__ = "holidays"

    date: Mapped[DateType] = mapped_column(Date, unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    is_recurring: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
