from app.exceptions.base import BaseAppException


class PositionNotFoundException(BaseAppException):
    status_code = 404
    detail = "Position not found"


class PositionAlreadyExistsException(BaseAppException):
    status_code = 409
    detail = "Position with this name already exists"


class DatabaseException(BaseAppException):
    status_code = 500
    detail = "Database error"
