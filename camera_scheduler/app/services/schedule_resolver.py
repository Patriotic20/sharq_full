from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.work_schedule import WorkSchedule


async def resolve_schedule(
    session: AsyncSession, department_id: int | None
) -> WorkSchedule | None:
    """Resolve effective work schedule:
    1. Department-specific (via work_schedule_departments M2M) if dept_id known.
    2. Default schedule (applies_to_all = true).
    3. None — caller should skip status computation.
    """
    if department_id is not None:
        # Use raw SQL join via the M2M table since we don't import its model here.
        from sqlalchemy import text

        result = await session.execute(
            text(
                """
                SELECT ws.* FROM work_schedule ws
                JOIN work_schedule_departments wsd ON wsd.work_schedule_id = ws.id
                WHERE wsd.department_id = :dept_id
                LIMIT 1
                """
            ),
            {"dept_id": department_id},
        )
        row = result.mappings().first()
        if row is not None:
            ws_result = await session.execute(
                select(WorkSchedule).where(WorkSchedule.id == row["id"])
            )
            return ws_result.scalar_one()

    default_result = await session.execute(
        select(WorkSchedule).where(WorkSchedule.applies_to_all.is_(True))
    )
    return default_result.scalar_one_or_none()
