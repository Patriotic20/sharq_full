from app.exceptions.base import BaseAppException


class WorkScheduleNotFoundException(BaseAppException):
    status_code = 404
    detail = "Work schedule not found"


class WorkScheduleAlreadyExistsException(BaseAppException):
    status_code = 409
    detail = "Work schedule with this name already exists"


class DefaultWorkScheduleConflictException(BaseAppException):
    status_code = 409
    detail = "Only one work schedule can be marked as default (applies_to_all)"


class DepartmentAlreadyAssignedException(BaseAppException):
    status_code = 409
    detail = "One or more departments are already assigned to another schedule"


class GroupAlreadyAssignedException(BaseAppException):
    status_code = 409
    detail = "One or more groups are already assigned to another schedule"


class CannotDeleteDefaultScheduleException(BaseAppException):
    status_code = 409
    detail = "Cannot delete the default work schedule"


class WorkScheduleDatabaseException(BaseAppException):
    status_code = 500
    detail = "Database error"
