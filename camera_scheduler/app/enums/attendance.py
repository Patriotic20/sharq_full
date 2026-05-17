from enum import Enum


class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    LEFT_EARLY = "left_early"


class PresenceStatus(str, Enum):
    COMPLETE = "complete"
    NO_EXIT = "no_exit"
    NO_ENTRY = "no_entry"
