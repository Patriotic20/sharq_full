import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers.attendances import router as attendance_router
from app.routers.camera import router as camera_router
from app.routers.employees import router as employee_router
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

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors.origins,
    allow_credentials=settings.cors.allow_credentials,
    allow_methods=settings.cors.allow_methods,
    allow_headers=settings.cors.allow_headers,
)

app.include_router(camera_router, prefix="/api/v1")
app.include_router(employee_router, prefix="/api/v1")
app.include_router(attendance_router, prefix="/api/v1")
app.include_router(work_schedule_router, prefix="/api/v1")
