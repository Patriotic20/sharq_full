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


class LeaveType(str, Enum):
    SICK = "sick"                            # F  — Mehnatga layoqatsizlik
    VACATION_ANNUAL = "vacation_annual"      # RP — Yillik mehnat ta'tili
    VACATION_EDUCATION = "vacation_education"  # G — O'quv ta'tili
    LEAVE_EDUCATION = "leave_education"      # N  — O'qish bo'yicha dam olishlar
    ADMIN_ABSENCE = "admin_absence"          # V  — Ma'muriyat ruxsati bilan
    STATE_DUTY = "state_duty"                # OU — Davlat oldidagi majburiyatlar
    MATERNITY = "maternity"                  # R  — Tug'ish bilan bog'liq ta'tillar