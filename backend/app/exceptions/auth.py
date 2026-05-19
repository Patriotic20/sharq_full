from app.exceptions.base import BaseAppException


class InvalidCredentialsException(BaseAppException):
    status_code = 401
    detail = "Invalid username or password"


class InvalidTokenException(BaseAppException):
    status_code = 401
    detail = "Invalid token"


class TokenExpiredException(BaseAppException):
    status_code = 401
    detail = "Token has expired"


class PermissionDeniedException(BaseAppException):
    status_code = 403
    detail = "Permission denied"


class InactiveUserException(BaseAppException):
    status_code = 403
    detail = "User is inactive"
