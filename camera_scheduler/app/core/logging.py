"""Конфигурация логирования. Импортировать `setup_logging()` один раз при старте."""

import logging
import os
import sys


def setup_logging(level: str | None = None) -> None:
    log_level = (level or os.getenv("LOG_LEVEL") or "INFO").upper()

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(
        fmt="%(asctime)s [%(levelname)-7s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    ))

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(log_level)

    # apscheduler шумит на DEBUG — приглушим до WARNING
    logging.getLogger("apscheduler").setLevel(logging.WARNING)
    # httpx тоже логирует каждый запрос на INFO — оставим WARNING, иначе шум
    logging.getLogger("httpx").setLevel(logging.WARNING)
