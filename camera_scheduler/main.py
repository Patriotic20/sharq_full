"""Точка входа: планировщик AccessLog → БД (attendances)."""

import asyncio
import logging
import os
import signal
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv

load_dotenv()

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.database import db_helper
from app.core.logging import setup_logging
from app.services.access_logs import fetch_access_logs
from app.services.attendance import mark_absentees

TZ = timezone(timedelta(hours=5))  # Toshkent UTC+5

logger = logging.getLogger(__name__)


async def _reconcile_absentees() -> None:
    day = datetime.now(TZ).strftime("%Y-%m-%d")
    created = await mark_absentees(day)
    logger.info("mark_absentees(%s): создано absent-строк = %d", day, created)


def _build_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone=TZ)
    scheduler.add_job(fetch_access_logs, "cron", hour=9, minute=0, kwargs={"shift": "morning"})
    scheduler.add_job(fetch_access_logs, "cron", hour=20, minute=0, kwargs={"shift": "evening"})
    scheduler.add_job(_reconcile_absentees, "cron", hour=20, minute=30)
    return scheduler


def _install_signal_handlers(stop_event: asyncio.Event) -> None:
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, stop_event.set)
        except NotImplementedError:
            # Windows / non-main-thread fallback.
            signal.signal(sig, lambda *_: stop_event.set())


async def main() -> None:
    stop_event = asyncio.Event()
    _install_signal_handlers(stop_event)

    scheduler = _build_scheduler()
    scheduler.start()

    logger.info("Планировщик запущен")
    logger.info("  09:00 → утренний сбор (сегодня 06:00 → 09:00)")
    logger.info("  20:00 → полный сбор за день (сегодня 06:00 → 20:00)")
    logger.info("  20:30 → отметка отсутствующих за день")

    if os.getenv("RUN_ON_STARTUP", "false").lower() == "true":
        logger.info("RUN_ON_STARTUP=true → тестовый прогон при старте...")
        try:
            await fetch_access_logs("evening")
        except Exception:
            logger.exception("Тестовый прогон упал — продолжаем с расписанием")
        logger.info("Тестовый прогон завершён.")

    logger.info("Ожидание расписания. SIGINT/SIGTERM для остановки.")
    try:
        await stop_event.wait()
    finally:
        logger.info("Получен сигнал остановки — завершаем...")
        scheduler.shutdown(wait=False)
        await db_helper.dispose()
        logger.info("Остановлено корректно")


if __name__ == "__main__":
    setup_logging()
    asyncio.run(main())
