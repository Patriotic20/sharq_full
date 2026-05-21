from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_session, require_permission
from app.schemas.report import TabelDataResponse
from app.services.tabel_report import build_tabel_data, build_tabel_xlsx

router = APIRouter(prefix="/reports", tags=["reports"])

XLSX_MEDIA = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


@router.get(
    "/tabel",
    response_model=TabelDataResponse,
    dependencies=[Depends(require_permission("reports:read"))],
)
async def get_tabel_data(
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    department_id: int | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
) -> TabelDataResponse:
    try:
        data = await build_tabel_data(session, year, month, department_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return TabelDataResponse.model_validate(data)


@router.get(
    "/tabel.xlsx",
    dependencies=[Depends(require_permission("reports:read"))],
)
async def export_tabel(
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    department_id: int | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
):
    try:
        data = await build_tabel_xlsx(session, year, month, department_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    suffix = f"_dep{department_id}" if department_id else ""
    filename = f"tabel_{year}_{month:02d}{suffix}.xlsx"
    return StreamingResponse(
        BytesIO(data),
        media_type=XLSX_MEDIA,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
