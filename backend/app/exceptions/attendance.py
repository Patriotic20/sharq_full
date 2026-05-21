from app.exceptions.base import BaseAppException


class AttendanceNotFoundException(BaseAppException):
    status_code = 404
    detail = "Attendance record not found"


class DatabaseException(BaseAppException):
    status_code = 500
    detail = "Database error"


class AttendanceConflictException(BaseAppException):
    status_code = 409
    detail = "Attendance record for this employee and date already exists"
