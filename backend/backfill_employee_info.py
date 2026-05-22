"""One-off script: create a minimal EmployeeInfo row for every Employee that
doesn't have one yet. Safe to re-run (idempotent thanks to the unique
constraint on employe_info.employee_id and the LEFT JOIN filter).

Usage:
    cd backend
    .venv/bin/python backfill_employee_info.py
"""
import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings
from app.models.employe_info import EmployeeInfo
from app.models.employees import Employee

engine = create_async_engine(str(settings.database.url), echo=False)
Session = async_sessionmaker(engine, expire_on_commit=False)


async def backfill() -> None:
    async with Session() as session:
        rows = (
            await session.execute(
                select(Employee)
                .outerjoin(EmployeeInfo, EmployeeInfo.employee_id == Employee.id)
                .where(EmployeeInfo.id.is_(None))
            )
        ).scalars().unique().all()

        if not rows:
            print("Nothing to backfill — every employee already has EmployeeInfo.")
            return

        for emp in rows:
            full_name = f"{emp.last_name} {emp.first_name} {emp.middle_name}".strip()
            session.add(EmployeeInfo(employee_id=emp.id, full_name=full_name))

        await session.commit()
        print(f"Backfilled {len(rows)} EmployeeInfo row(s).")


if __name__ == "__main__":
    asyncio.run(backfill())
