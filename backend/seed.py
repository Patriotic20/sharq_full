import asyncio
from datetime import datetime, time, timezone, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.core.config import settings
from app.enums.attendance import AttendanceStatus, PresenceStatus
from app.enums.camera import CameraType
from app.models.cameras import Camera
from app.models.employees import Employee
from app.models.attendances import Attendance
from app.models.work_schedule import WorkSchedule

engine = create_async_engine(str(settings.database.url), echo=False)
Session = async_sessionmaker(engine, expire_on_commit=False)


def dt(hour: int, minute: int = 0, days_ago: int = 0) -> datetime:
    d = datetime.now(timezone.utc).replace(hour=hour, minute=minute, second=0, microsecond=0)
    return d - timedelta(days=days_ago)


async def seed():
    async with Session() as session:
        # Work schedule (idempotent — migration creates id=1, top up if missing).
        existing = (await session.execute(select(WorkSchedule).where(WorkSchedule.id == 1))).scalar_one_or_none()
        if existing is None:
            session.add(WorkSchedule(id=1, start_time=time(9, 0), end_time=time(18, 0)))
            await session.flush()

        # Cameras
        cam_enter = Camera(ip_address="192.168.1.10", login="admin", password="admin123", type=CameraType.ENTER)
        cam_exit  = Camera(ip_address="192.168.1.11", login="admin", password="admin123", type=CameraType.EXIT)
        cam_enter2 = Camera(ip_address="192.168.1.20", login="root", password="root456", type=CameraType.ENTER)
        session.add_all([cam_enter, cam_exit, cam_enter2])
        await session.flush()

        # Employees
        employees = [
            Employee(first_name="Алексей",    last_name="Иванов",    middle_name="Петрович",   camera_user_id="user_001"),
            Employee(first_name="Мария",      last_name="Смирнова",  middle_name="Юрьевна",    camera_user_id="user_002"),
            Employee(first_name="Дмитрий",    last_name="Козлов",    middle_name="Игоревич",   camera_user_id="user_003"),
            Employee(first_name="Анна",       last_name="Новикова",  middle_name="Сергеевна",  camera_user_id="user_004"),
            Employee(first_name="Сергей",     last_name="Морозов",   middle_name="Владимирович", camera_user_id="user_005"),
            Employee(first_name="Ольга",      last_name="Волкова",   middle_name="Николаевна", camera_user_id=None),
        ]
        session.add_all(employees)
        await session.flush()

        e1, e2, e3, e4, e5, e6 = employees

        # Attendances — today
        today_records = [
            Attendance(employee_id=e1.id, enter_camera_id=cam_enter.id,  enter_time=dt(8, 55),  enter_rec_no=1001,
                       exit_camera_id=cam_exit.id, exit_time=dt(18, 3),  exit_rec_no=2001,
                       status=AttendanceStatus.PRESENT,    presence_status=PresenceStatus.COMPLETE),

            Attendance(employee_id=e2.id, enter_camera_id=cam_enter.id,  enter_time=dt(9, 17),  enter_rec_no=1002,
                       exit_camera_id=cam_exit.id, exit_time=dt(17, 45), exit_rec_no=2002,
                       status=AttendanceStatus.LATE,       presence_status=PresenceStatus.COMPLETE),

            Attendance(employee_id=e3.id, enter_camera_id=cam_enter2.id, enter_time=dt(8, 50),  enter_rec_no=1003,
                       exit_camera_id=None,         exit_time=None,       exit_rec_no=None,
                       status=AttendanceStatus.PRESENT,    presence_status=PresenceStatus.NO_EXIT),

            Attendance(employee_id=e4.id, enter_camera_id=None,          enter_time=None,       enter_rec_no=None,
                       exit_camera_id=None,         exit_time=None,       exit_rec_no=None,
                       status=AttendanceStatus.ABSENT,     presence_status=PresenceStatus.NO_ENTRY),

            Attendance(employee_id=e5.id, enter_camera_id=cam_enter.id,  enter_time=dt(8, 59),  enter_rec_no=1004,
                       exit_camera_id=cam_exit.id, exit_time=dt(14, 30), exit_rec_no=2003,
                       status=AttendanceStatus.LEFT_EARLY, presence_status=PresenceStatus.COMPLETE),

            Attendance(employee_id=e6.id, enter_camera_id=cam_enter2.id, enter_time=dt(9, 1),   enter_rec_no=1005,
                       exit_camera_id=cam_exit.id, exit_time=dt(18, 0),  exit_rec_no=2004,
                       status=AttendanceStatus.PRESENT,    presence_status=PresenceStatus.COMPLETE),
        ]

        # Attendances — yesterday
        yesterday_records = [
            Attendance(employee_id=e1.id, enter_camera_id=cam_enter.id,  enter_time=dt(9, 2, 1),  enter_rec_no=901,
                       exit_camera_id=cam_exit.id, exit_time=dt(18, 10, 1), exit_rec_no=902,
                       status=AttendanceStatus.PRESENT,    presence_status=PresenceStatus.COMPLETE),

            Attendance(employee_id=e2.id, enter_camera_id=cam_enter.id,  enter_time=dt(9, 0, 1),  enter_rec_no=903,
                       exit_camera_id=cam_exit.id, exit_time=dt(18, 0, 1),  exit_rec_no=904,
                       status=AttendanceStatus.PRESENT,    presence_status=PresenceStatus.COMPLETE),

            Attendance(employee_id=e3.id, enter_camera_id=None,          enter_time=None,          enter_rec_no=None,
                       exit_camera_id=None,         exit_time=None,          exit_rec_no=None,
                       status=AttendanceStatus.ABSENT,     presence_status=None),

            Attendance(employee_id=e5.id, enter_camera_id=cam_enter2.id, enter_time=dt(8, 45, 1), enter_rec_no=905,
                       exit_camera_id=cam_exit.id, exit_time=dt(18, 5, 1),  exit_rec_no=906,
                       status=AttendanceStatus.PRESENT,    presence_status=PresenceStatus.COMPLETE),
        ]

        session.add_all(today_records + yesterday_records)
        await session.commit()

    print("✓ Seed complete:")
    print(f"  Cameras:     3")
    print(f"  Employees:   6")
    print(f"  Attendances: {len(today_records)} today + {len(yesterday_records)} yesterday")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
