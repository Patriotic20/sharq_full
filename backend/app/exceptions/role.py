from app.exceptions.base import BaseAppException


class RoleNotFoundException(BaseAppException):
    status_code = 404
    detail = "Role not found"


class RoleAlreadyExistsException(BaseAppException):
    status_code = 409
    detail = "Role with this name already exists"


class RoleInUseException(BaseAppException):
    status_code = 409
    detail = "Role is assigned to one or more users"


class RoleProtectedException(BaseAppException):
    status_code = 403
    detail = "This role is protected and cannot be modified or deleted"


class DatabaseException(BaseAppException):
    status_code = 500
    detail = "Database error"
