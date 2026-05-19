from pydantic import BaseModel, Field


class RolePermissionAssign(BaseModel):
    permission_ids: list[int] = Field(default_factory=list)
