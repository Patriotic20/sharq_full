"""Seed 3 months of attendance history for every existing employee.

Usage (inside backend container):
    docker compose exec backend python seed_attendance_history.py

Or locally with the venv (pointing APP_CONFIG__DATABASE__URL to localhost):
    APP_CONFIG__DATABASE__URL=postgresql+asyncpg://sharq:sharq@localhost:5432/sharq \
        .venv/bin/python seed_attendance_history.py
"""
import asyncio
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings
from app.enums.attendance import AttendanceStatus, PresenceStatus
from app.enums.camera import CameraType
from app.models.attendances import Attendance
from app.models.cameras import Camera
from app.models.employees import Employee
from app.models.work_schedule import WorkSchedule
from datetime import time as DTime

DAYS = 90
SEED = 42
random.seed(SEED)


def pick_status() -> AttendanceStatus:
    r = random.random()
    if r < 0.65:
        return AttendanceStatus.PRESENT
    if r < 0.75:
        return AttendanceStatus.LATE
    if r < 0.80:
        return AttendanceStatus.LEFT_EARLY
    return AttendanceStatus.ABSENT


def build_record(
    employee_id: int,
    day: datetime,
    status: AttendanceStatus,
    enter_cam_id: int | None,
    exit_cam_id: int | None,
    rec_no: int,
) -> Attendance:
    if status == AttendanceStatus.ABSENT:
        return Attendance(
            employee_id=employee_id,
            enter_camera_id=None,
            enter_time=None,
            enter_rec_no=None,
            exit_camera_id=None,
            exit_time=None,
            exit_rec_no=None,
            status=status,
            presence_status=PresenceStatus.NO_ENTRY,
        )

    if status == AttendanceStatus.LATE:
        enter_h, enter_m = 9, random.randint(15, 55)
        exit_h, exit_m = 18, random.randint(0, 20)
        presence = PresenceStatus.COMPLETE
    elif status == AttendanceStatus.LEFT_EARLY:
        enter_h, enter_m = 8, random.randint(50, 59)
        exit_h, exit_m = random.choice([14, 15, 16]), random.randint(0, 59)
        presence = PresenceStatus.COMPLETE
    else:
        enter_h, enter_m = 8, random.randint(50, 59)
        exit_h, exit_m = 18, random.randint(0, 15)
        presence = PresenceStatus.COMPLETE

    enter_time = day.replace(hour=enter_h, minute=enter_m, second=random.randint(0, 59))
    exit_time = day.replace(hour=exit_h, minute=exit_m, second=random.randint(0, 59))

    return Attendance(
        employee_id=employee_id,
        enter_camera_id=enter_cam_id,
        enter_time=enter_time,
        enter_rec_no=rec_no,
        exit_camera_id=exit_cam_id,
        exit_time=exit_time,
        exit_rec_no=rec_no,
        status=status,
        presence_status=presence,
    )


async def main() -> None:
    engine = create_async_engine(str(settings.database.url), echo=False)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as session:
        # Ensure work schedule exists (referenced by attendance status compute).
        ws = (await session.execute(select(WorkSchedule).where(WorkSchedule.id == 1))).scalar_one_or_none()
        if ws is None:
            session.add(WorkSchedule(id=1, start_time=DTime(9, 0), end_time=DTime(18, 0)))
            await session.flush()
            print("  created default WorkSchedule")

        employees = (await session.execute(select(Employee))).scalars().all()
        if not employees:
            print("  no employees found — creating 10 demo employees")
            demo = [
                ("Алексей",  "Иванов",    "Петрович",       "user_001"),
                ("Мария",    "Смирнова",  "Юрьевна",        "user_002"),
                ("Дмитрий",  "Козлов",    "Игоревич",       "user_003"),
                ("Анна",     "Новикова",  "Сергеевна",      "user_004"),
                ("Сергей",   "Морозов",   "Владимирович",   "user_005"),
                ("Ольга",    "Волкова",   "Николаевна",     None),
                ("Behzod",   "Mansurov",  "Baxtiyor o'g'li", "user_007"),
                ("Nargiza",  "Qodirova",  "Akmal qizi",     "user_008"),
                ("Mirshod",  "Karimov",   "Sherzod o'g'li", "user_009"),
                ("Umida",    "Jalilova",  "Abdusalimovna",  "user_010"),
            ]
            session.add_all([
                Employee(first_name=f, last_name=l, middle_name=m, camera_user_id=u)
                for f, l, m, u in demo
            ])
            await session.flush()
            employees = (await session.execute(select(Employee))).scalars().all()

        cameras = (await session.execute(select(Camera))).scalars().all()
        enter_cams = [c for c in cameras if c.type == CameraType.ENTER]
        exit_cams = [c for c in cameras if c.type == CameraType.EXIT]

        if not enter_cams or not exit_cams:
            # Create defaults so generated records have a camera reference.
            cam_enter = Camera(ip_address="10.0.0.10", login="admin", password="admin", type=CameraType.ENTER)
            cam_exit = Camera(ip_address="10.0.0.11", login="admin", password="admin", type=CameraType.EXIT)
            session.add_all([cam_enter, cam_exit])
            await session.flush()
            enter_cams = enter_cams or [cam_enter]
            exit_cams = exit_cams or [cam_exit]

        # Wipe existing attendances so re-runs stay clean.
        deleted = (await session.execute(delete(Attendance))).rowcount
        print(f"  removed {deleted} existing attendance rows")

        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

        # Independent per-camera counters so (camera_id, rec_no) stays unique.
        enter_counter: dict[int, int] = {c.id: 0 for c in enter_cams}
        exit_counter: dict[int, int] = {c.id: 0 for c in exit_cams}

        records: list[Attendance] = []
        for emp in employees:
            for d in range(DAYS, 0, -1):
                day = today - timedelta(days=d)
                # Weekends: 60% chance of ABSENT, 40% no record at all.
                if day.weekday() >= 5:
                    if random.random() < 0.4:
                        continue
                    status = AttendanceStatus.ABSENT
                else:
                    status = pick_status()

                enter_cam = random.choice(enter_cams)
                exit_cam = random.choice(exit_cams)
                enter_counter[enter_cam.id] += 1
                exit_counter[exit_cam.id] += 1

                rec = build_record(
                    employee_id=emp.id,
                    day=day,
                    status=status,
                    enter_cam_id=enter_cam.id if status != AttendanceStatus.ABSENT else None,
                    exit_cam_id=exit_cam.id if status != AttendanceStatus.ABSENT else None,
                    rec_no=0,
                )
                if status != AttendanceStatus.ABSENT:
                    rec.enter_rec_no = enter_counter[enter_cam.id]
                    rec.exit_rec_no = exit_counter[exit_cam.id]
                records.append(rec)

        session.add_all(records)
        await session.commit()

        print(f"✓ Seed complete:")
        print(f"  Employees seeded: {len(employees)}")
        print(f"  Days per employee: {DAYS}")
        print(f"  Total attendance rows inserted: {len(records)}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
