from app.repositories.permission import PermissionRepository
from app.schemas.permission import PermissionListResponse, PermissionRead


class PermissionService:
    def __init__(self, repo: PermissionRepository) -> None:
        self.repo = repo

    async def list(self) -> PermissionListResponse:
        items = await self.repo.list_all()
        return PermissionListResponse(
            items=[PermissionRead.model_validate(p) for p in items],
            total=len(items),
        )
