from app.exceptions.base import BaseAppException


class CameraNotFoundException(BaseAppException):
    status_code = 404
    detail = "Camera not found"


class CameraAlreadyExistsException(BaseAppException):
    status_code = 409
    detail = "Camera with this IP already exists"


class DatabaseException(BaseAppException):
    status_code = 500
    detail = "Database error"
