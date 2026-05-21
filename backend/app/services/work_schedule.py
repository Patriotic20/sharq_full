from app.exceptions.department import DepartmentNotFoundException
from app.exceptions.group import GroupNotFoundException
from app.exceptions.work_schedule import (
    CannotDeleteDefaultScheduleException,
    DefaultWorkScheduleConflictException,
    DepartmentAlreadyAssignedException,
    GroupAlreadyAssignedException,
    WorkScheduleAlreadyExistsException,
    WorkScheduleNotFoundException,
)
from app.models.employees import Employee
from app.models.work_schedule import WorkSchedule
from app.repositories.work_schedule import WorkScheduleRepository
from app.schemas.common import PaginationParams
from app.schemas.work_schedule import (
    WorkScheduleCreate,
    WorkScheduleListResponse,
    WorkScheduleRead,
    WorkScheduleSearchParams,
    WorkScheduleUpdate,
)


class WorkScheduleService:
    def __init__(self, repo: WorkScheduleRepository) -> None:
        self.repo = repo

    async def create(self, data: WorkScheduleCreate) -> WorkScheduleRead:
        if await self.repo.get_by_name(data.name) is not None:
            raise WorkScheduleAlreadyExistsException()

        if data.applies_to_all:
            existing_default = await self.repo.get_default()
            if existing_default is not None:
                raise DefaultWorkScheduleConflictException()

        if data.department_ids:
            assigned = await self.repo.departments_assigned_elsewhere(
                data.department_ids
            )
            if assigned:
                raise DepartmentAlreadyAssignedException()
            depts = await self.repo.fetch_departments(data.department_ids)
            if len(depts) != len(set(data.department_ids)):
                raise DepartmentNotFoundException()
        else:
            depts = []

        if data.group_ids:
            assigned = await self.repo.groups_assigned_elsewhere(data.group_ids)
            if assigned:
                raise GroupAlreadyAssignedException()
            groups = await self.repo.fetch_groups(data.group_ids)
            if len(groups) != len(set(data.group_ids)):
                raise GroupNotFoundException()
        else:
            groups = []

        schedule = WorkSchedule(
            name=data.name,
            start_time=data.start_time,
            end_time=data.end_time,
            late_threshold_minutes=data.late_threshold_minutes,
            early_leave_threshold_minutes=data.early_leave_threshold_minutes,
            applies_to_all=data.applies_to_all,
        )
        schedule.departments = depts
        schedule.groups = groups
        await self.repo.add(schedule)
        schedule = await self.repo.commit_refresh(schedule)
        return WorkScheduleRead.model_validate(schedule)

    async def get(self, schedule_id: int) -> WorkScheduleRead:
        schedule = await self.repo.get_by_id(schedule_id)
        if schedule is None:
            raise WorkScheduleNotFoundException()
        return WorkScheduleRead.model_validate(schedule)

    async def list(
        self,
        pagination: PaginationParams,
        search: WorkScheduleSearchParams,
    ) -> WorkScheduleListResponse:
        items, total = await self.repo.list_with_count(
            limit=pagination.limit,
            offset=pagination.offset,
            name=search.name,
            order=search.order,
        )
        return WorkScheduleListResponse.build(
            items=[WorkScheduleRead.model_validate(s) for s in items],
            total=total,
            pagination=pagination,
        )

    async def update(
        self, schedule_id: int, data: WorkScheduleUpdate
    ) -> WorkScheduleRead:
        schedule = await self.repo.get_by_id(schedule_id)
        if schedule is None:
            raise WorkScheduleNotFoundException()

        if data.name is not None and data.name != schedule.name:
            existing = await self.repo.get_by_name(data.name)
            if existing is not None and existing.id != schedule.id:
                raise WorkScheduleAlreadyExistsException()
            schedule.name = data.name

        if data.applies_to_all is not None and data.applies_to_all != schedule.applies_to_all:
            if data.applies_to_all:
                existing_default = await self.repo.get_default()
                if existing_default is not None and existing_default.id != schedule.id:
                    raise DefaultWorkScheduleConflictException()
            schedule.applies_to_all = data.applies_to_all

        for attr in (
            "start_time",
            "end_time",
            "late_threshold_minutes",
            "early_leave_threshold_minutes",
        ):
            value = getattr(data, attr)
            if value is not None:
                setattr(schedule, attr, value)

        # end_time vs start_time may have changed via either side — re-validate.
        if schedule.end_time <= schedule.start_time:
            raise ValueError("end_time must be after start_time")

        if data.department_ids is not None:
            if data.department_ids:
                assigned = await self.repo.departments_assigned_elsewhere(
                    data.department_ids, exclude_schedule_id=schedule.id
                )
                if assigned:
                    raise DepartmentAlreadyAssignedException()
                depts = await self.repo.fetch_departments(data.department_ids)
                if len(depts) != len(set(data.department_ids)):
                    raise DepartmentNotFoundException()
            else:
                depts = []
            schedule.departments = depts

        if data.group_ids is not None:
            if data.group_ids:
                assigned = await self.repo.groups_assigned_elsewhere(
                    data.group_ids, exclude_schedule_id=schedule.id
                )
                if assigned:
                    raise GroupAlreadyAssignedException()
                groups = await self.repo.fetch_groups(data.group_ids)
                if len(groups) != len(set(data.group_ids)):
                    raise GroupNotFoundException()
            else:
                groups = []
            schedule.groups = groups

        schedule = await self.repo.commit_refresh(schedule)
        return WorkScheduleRead.model_validate(schedule)

    async def delete(self, schedule_id: int) -> None:
        schedule = await self.repo.get_by_id(schedule_id)
        if schedule is None:
            raise WorkScheduleNotFoundException()
        if schedule.applies_to_all:
            raise CannotDeleteDefaultScheduleException()
        await self.repo.delete(schedule)

    async def resolve_for_employee(self, employee: Employee) -> WorkSchedule | None:
        if employee.department_id is not None:
            dept_schedule = await self.repo.get_for_department(employee.department_id)
            if dept_schedule is not None:
                return dept_schedule
        return await self.repo.get_default()
