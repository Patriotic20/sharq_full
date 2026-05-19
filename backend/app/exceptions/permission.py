from app.exceptions.base import BaseAppException


class PermissionNotFoundException(BaseAppException):
    status_code = 404
    detail = "Permission not found"
