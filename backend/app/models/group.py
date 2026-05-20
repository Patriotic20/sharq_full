from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base
from .mixins.id_int_pk import IdIntPk
from .mixins.time_stamp_mixin import TimestampMixin


class Group(Base, IdIntPk, TimestampMixin):
    __tablename__ = "groups"

    name: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
