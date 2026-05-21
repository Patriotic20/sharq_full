import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import db_helper
from app.core.seed_rbac import seed_rbac
from app.routers.attendances import router as attendance_router
from app.routers.auth import router as auth_router
from app.routers.camera import router as camera_router
from app.routers.departments import router as department_router
from app.routers.employees import router as employee_router
from app.routers.groups import router as group_router
from app.routers.holidays import router as holiday_router
from app.routers.permissions import router as permission_router
from app.routers.reports import router as reports_router
from app.routers.role_permissions import router as role_permission_router
from app.routers.roles import router as role_router
from app.routers.users import router as user_router
from app.routers.work_schedule import router as work_schedule_router


class _AccessLogPathFilter(logging.Filter):
    _MUTED_PATHS = ("/docs", "/redoc", "/openapi.json", "/favicon.ico")

    def filter(self, record: logging.LogRecord) -> bool:
        args = record.args
        if isinstance(args, tuple) and len(args) >= 3:
            path = str(args[2])
            return not any(path.startswith(p) for p in self._MUTED_PATHS)
        return True


logging.getLogger("uvicorn.access").addFilter(_AccessLogPathFilter())


@asynccontextmanager
async def lifespan(_: FastAPI):
    async with db_helper.session_factory() as session:
        await seed_rbac(session)
    yield
    await db_helper.dispose()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors.origins,
    allow_credentials=settings.cors.allow_credentials,
    allow_methods=settings.cors.allow_methods,
    allow_headers=settings.cors.allow_headers,
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(user_router, prefix="/api/v1")
app.include_router(role_router, prefix="/api/v1")
app.include_router(permission_router, prefix="/api/v1")
app.include_router(role_permission_router, prefix="/api/v1")
app.include_router(camera_router, prefix="/api/v1")
app.include_router(employee_router, prefix="/api/v1")
app.include_router(department_router, prefix="/api/v1")
app.include_router(group_router, prefix="/api/v1")
app.include_router(attendance_router, prefix="/api/v1")
app.include_router(work_schedule_router, prefix="/api/v1")
app.include_router(holiday_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
