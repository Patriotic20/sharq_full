from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PermissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    description: str | None
    created_at: datetime
    updated_at: datetime


class PermissionListResponse(BaseModel):
    items: list[PermissionRead]
    total: int
