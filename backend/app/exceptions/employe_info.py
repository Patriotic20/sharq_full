from app.exceptions.base import BaseAppException


class EmployeeInfoNotFoundException(BaseAppException):
    status_code = 404
    detail = "Employee info not found"


class EmployeeInfoAlreadyExistsException(BaseAppException):
    status_code = 409
    detail = "Employee info for this employee already exists"


class DatabaseException(BaseAppException):
    status_code = 500
    detail = "Database error"
