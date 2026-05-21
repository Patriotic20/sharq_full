from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_session, require_permission
from app.repositories.holiday import HolidayRepository
from app.schemas.holiday import (
    HolidayCreate,
    HolidayListResponse,
    HolidayRead,
    HolidayUpdate,
)

router = APIRouter(prefix="/holidays", tags=["holidays"])


def get_repo(session: AsyncSession = Depends(get_session)) -> HolidayRepository:
    return HolidayRepository(session)


@router.get(
    "/",
    response_model=HolidayListResponse,
    dependencies=[Depends(require_permission("holidays:read"))],
)
async def list_holidays(
    page: int = 1,
    size: int = 100,
    repo: HolidayRepository = Depends(get_repo),
) -> HolidayListResponse:
    limit = max(1, min(size, 500))
    offset = max(0, (page - 1) * limit)
    items, total = await repo.list(limit=limit, offset=offset)
    return HolidayListResponse.build(
        items=[HolidayRead.model_validate(h) for h in items],
        total=total,
        page=page,
        size=limit,
    )


@router.post(
    "/",
    response_model=HolidayRead,
    status_code=201,
    dependencies=[Depends(require_permission("holidays:write"))],
)
async def create_holiday(
    data: HolidayCreate,
    repo: HolidayRepository = Depends(get_repo),
) -> HolidayRead:
    existing = await repo.get_by_date(data.date)
    if existing is not None:
        raise HTTPException(status_code=409, detail="Holiday for this date already exists")
    holiday = await repo.create(data)
    return HolidayRead.model_validate(holiday)


@router.patch(
    "/{holiday_id}",
    response_model=HolidayRead,
    dependencies=[Depends(require_permission("holidays:write"))],
)
async def update_holiday(
    holiday_id: int,
    data: HolidayUpdate,
    repo: HolidayRepository = Depends(get_repo),
) -> HolidayRead:
    holiday = await repo.get_by_id(holiday_id)
    if holiday is None:
        raise HTTPException(status_code=404, detail="Holiday not found")
    holiday = await repo.update(holiday, data)
    return HolidayRead.model_validate(holiday)


@router.delete(
    "/{holiday_id}",
    status_code=204,
    dependencies=[Depends(require_permission("holidays:delete"))],
)
async def delete_holiday(
    holiday_id: int,
    repo: HolidayRepository = Depends(get_repo),
) -> None:
    holiday = await repo.get_by_id(holiday_id)
    if holiday is None:
        raise HTTPException(status_code=404, detail="Holiday not found")
    await repo.delete(holiday)
