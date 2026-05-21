from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.exceptions.work_schedule import WorkScheduleDatabaseException
from app.models.department import Department
from app.models.group import Group
from app.models.work_schedule import WorkSchedule
from app.models.work_schedule_department import WorkScheduleDepartment
from app.models.work_schedule_group import WorkScheduleGroup


class WorkScheduleRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def _base_select(self):
        return select(WorkSchedule).options(
            selectinload(WorkSchedule.departments),
            selectinload(WorkSchedule.groups),
        )

    async def get_by_id(self, schedule_id: int) -> WorkSchedule | None:
        result = await self.session.execute(
            self._base_select().where(WorkSchedule.id == schedule_id)
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> WorkSchedule | None:
        result = await self.session.execute(
            self._base_select().where(WorkSchedule.name == name)
        )
        return result.scalar_one_or_none()

    async def get_default(self) -> WorkSchedule | None:
        result = await self.session.execute(
            self._base_select().where(WorkSchedule.applies_to_all.is_(True))
        )
        return result.scalar_one_or_none()

    async def get_for_department(self, department_id: int) -> WorkSchedule | None:
        result = await self.session.execute(
            self._base_select()
            .join(
                WorkScheduleDepartment,
                WorkScheduleDepartment.work_schedule_id == WorkSchedule.id,
            )
            .where(WorkScheduleDepartment.department_id == department_id)
        )
        return result.scalar_one_or_none()

    async def list_all(self) -> list[WorkSchedule]:
        result = await self.session.execute(self._base_select())
        return list(result.scalars().unique().all())

    async def list_with_count(
        self,
        limit: int,
        offset: int,
        name: str | None,
        order: str = "desc",
    ) -> tuple[list[WorkSchedule], int]:
        base = select(WorkSchedule)
        if name:
            base = base.where(WorkSchedule.name.ilike(f"%{name}%"))

        count_result = await self.session.execute(
            select(func.count()).select_from(base.subquery())
        )
        total = count_result.scalar_one()

        order_col = (
            WorkSchedule.created_at.asc()
            if order == "asc"
            else WorkSchedule.created_at.desc()
        )
        query = self._base_select()
        if name:
            query = query.where(WorkSchedule.name.ilike(f"%{name}%"))
        query = query.order_by(order_col).limit(limit).offset(offset)

        result = await self.session.execute(query)
        items = list(result.scalars().unique().all())
        return items, total

    async def fetch_departments(self, ids: list[int]) -> list[Department]:
        if not ids:
            return []
        result = await self.session.execute(
            select(Department).where(Department.id.in_(ids))
        )
        return list(result.scalars().all())

    async def fetch_groups(self, ids: list[int]) -> list[Group]:
        if not ids:
            return []
        result = await self.session.execute(select(Group).where(Group.id.in_(ids)))
        return list(result.scalars().all())

    async def departments_assigned_elsewhere(
        self, dept_ids: list[int], exclude_schedule_id: int | None = None
    ) -> list[int]:
        if not dept_ids:
            return []
        query = select(WorkScheduleDepartment.department_id).where(
            WorkScheduleDepartment.department_id.in_(dept_ids)
        )
        if exclude_schedule_id is not None:
            query = query.where(
                WorkScheduleDepartment.work_schedule_id != exclude_schedule_id
            )
        result = await self.session.execute(query)
        return [row[0] for row in result.all()]

    async def groups_assigned_elsewhere(
        self, group_ids: list[int], exclude_schedule_id: int | None = None
    ) -> list[int]:
        if not group_ids:
            return []
        query = select(WorkScheduleGroup.group_id).where(
            WorkScheduleGroup.group_id.in_(group_ids)
        )
        if exclude_schedule_id is not None:
            query = query.where(
                WorkScheduleGroup.work_schedule_id != exclude_schedule_id
            )
        result = await self.session.execute(query)
        return [row[0] for row in result.all()]

    async def commit_refresh(self, schedule: WorkSchedule) -> WorkSchedule:
        try:
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            raise WorkScheduleDatabaseException()
        except Exception:
            await self.session.rollback()
            raise WorkScheduleDatabaseException()
        # Refetch with eager-loaded relationships to avoid lazy-load on expired
        # attributes after commit.
        refreshed = await self.get_by_id(schedule.id)
        assert refreshed is not None
        return refreshed

    async def add(self, schedule: WorkSchedule) -> None:
        self.session.add(schedule)

    async def delete(self, schedule: WorkSchedule) -> None:
        try:
            await self.session.delete(schedule)
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise WorkScheduleDatabaseException()
