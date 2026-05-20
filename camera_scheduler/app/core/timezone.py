import os
from zoneinfo import ZoneInfo

APP_TZ_NAME = os.getenv("APP_TZ", "Asia/Tashkent")
APP_TZ = ZoneInfo(APP_TZ_NAME)
