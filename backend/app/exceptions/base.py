class BaseAppException(Exception):
    status_code: int = 500
    detail: str = "Internal server error"
