from datetime import date as DateType

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.core.timezone import APP_TZ_NAME
from app.enums.attendance import AttendanceStatus, PresenceStatus
from app.exceptions.attendance import DatabaseException
from app.models.attendance_event import AttendanceEvent
from app.models.attendances import Attendance
from app.schemas.attendance import AttendanceUpdate


class AttendanceRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def _with_relations(self):
        return select(Attendance).options(
            joinedload(Attendance.employee),
            joinedload(Attendance.enter_camera),
            joinedload(Attendance.exit_camera),
            selectinload(Attendance.events).joinedload(AttendanceEvent.camera),
        )

    def _build_filters(
        self,
        date: DateType | None,
        employee_id: int | None,
        status: AttendanceStatus | None,
        presence_status: PresenceStatus | None,
        date_from: DateType | None = None,
        date_to: DateType | None = None,
    ) -> list:
        filters = []
        if date:
            filters.append(
                func.date(func.timezone(APP_TZ_NAME, Attendance.enter_time)) == date
            )
        if date_from:
            filters.append(
                func.date(func.timezone(APP_TZ_NAME, Attendance.enter_time)) >= date_from
            )
        if date_to:
            filters.append(
                func.date(func.timezone(APP_TZ_NAME, Attendance.enter_time)) <= date_to
            )
        if employee_id:
            filters.append(Attendance.employee_id == employee_id)
        if status:
            filters.append(Attendance.status == status)
        if presence_status:
            filters.append(Attendance.presence_status == presence_status)
        return filters

    async def get_by_id(self, attendance_id: int) -> Attendance | None:
        result = await self.session.execute(
            self._with_relations().where(Attendance.id == attendance_id)
        )
        return result.unique().scalar_one_or_none()

    async def list(
        self,
        limit: int,
        offset: int,
        date: DateType | None,
        employee_id: int | None,
        status: AttendanceStatus | None,
        presence_status: PresenceStatus | None,
        date_from: DateType | None = None,
        date_to: DateType | None = None,
    ) -> tuple[list[Attendance], int]:
        filters = self._build_filters(
            date, employee_id, status, presence_status, date_from, date_to
        )

        count_result = await self.session.execute(
            select(func.count(Attendance.id)).where(*filters)
        )
        total = count_result.scalar_one()

        result = await self.session.execute(
            self._with_relations()
            .where(*filters)
            .order_by(Attendance.enter_time.desc().nulls_last())
            .limit(limit)
            .offset(offset)
        )
        return list(result.unique().scalars().all()), total

    async def update(self, attendance: Attendance, data: AttendanceUpdate) -> Attendance:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(attendance, field, value)
        try:
            await self.session.commit()
            result = await self.session.execute(
                self._with_relations().where(Attendance.id == attendance.id)
            )
            return result.unique().scalar_one()
        except Exception:
            await self.session.rollback()
            raise DatabaseException()

    async def delete(self, attendance: Attendance) -> None:
        try:
            await self.session.delete(attendance)
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise DatabaseException()
