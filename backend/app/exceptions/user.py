from app.exceptions.base import BaseAppException


class UserNotFoundException(BaseAppException):
    status_code = 404
    detail = "User not found"


class UserAlreadyExistsException(BaseAppException):
    status_code = 409
    detail = "User with this username already exists"


class DatabaseException(BaseAppException):
    status_code = 500
    detail = "Database error"
