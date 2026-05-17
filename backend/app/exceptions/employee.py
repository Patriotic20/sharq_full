from app.exceptions.base import BaseAppException


class EmployeeNotFoundException(BaseAppException):
    status_code = 404
    detail = "Employee not found"


class EmployeeAlreadyExistsException(BaseAppException):
    status_code = 409
    detail = "Employee with this camera_user_id already exists"


class DatabaseException(BaseAppException):
    status_code = 500
    detail = "Database error"
