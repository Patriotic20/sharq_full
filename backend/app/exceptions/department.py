from app.exceptions.base import BaseAppException


class DepartmentNotFoundException(BaseAppException):
    status_code = 404
    detail = "Department not found"


class DepartmentAlreadyExistsException(BaseAppException):
    status_code = 409
    detail = "Department with this name already exists"


class DatabaseException(BaseAppException):
    status_code = 500
    detail = "Database error"
