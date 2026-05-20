from app.exceptions.base import BaseAppException


class GroupNotFoundException(BaseAppException):
    status_code = 404
    detail = "Group not found"


class GroupAlreadyExistsException(BaseAppException):
    status_code = 409
    detail = "Group with this name already exists"


class DatabaseException(BaseAppException):
    status_code = 500
    detail = "Database error"
