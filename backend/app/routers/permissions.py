from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_session, require_permission
from app.repositories.permission import PermissionRepository
from app.schemas.permission import PermissionListResponse
from app.services.permission import PermissionService

router = APIRouter(prefix="/permissions", tags=["permissions"])


def get_permission_service(
    session: AsyncSession = Depends(get_session),
) -> PermissionService:
    return PermissionService(PermissionRepository(session))


@router.get(
    "/",
    response_model=PermissionListResponse,
    dependencies=[Depends(require_permission("permissions:read"))],
)
async def list_permissions(
    service: PermissionService = Depends(get_permission_service),
) -> PermissionListResponse:
    return await service.list()
