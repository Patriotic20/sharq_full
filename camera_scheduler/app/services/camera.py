from sqlalchemy import select
from app.models.cameras import Camera
from app.core.database import db_helper

async def get_camera(camera_id: int):
    async with db_helper.session_context() as session:
        result = await session.execute(
            select(Camera).where(Camera.id == camera_id)
        )
        camera = result.scalar_one_or_none()
        if camera is None:
            return None
        return {
            "id": camera.id,
            "ip_address": camera.ip_address,
            "login": camera.login,
            "password": camera.password,
            "type": camera.type,
        }
    
    
async def list_cameras():
    async with db_helper.session_context() as session:
        result = await session.execute(select(Camera))
        cameras = result.scalars().all()
        return [
            {
                "id": camera.id,
                "ip_address": camera.ip_address,
                "login": camera.login,
                "password": camera.password,
                "type": camera.type,
            }
            for camera in cameras
        ]   
