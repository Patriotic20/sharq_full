from sqlalchemy import select

from app.models.employees import Employee
from app.core.database import db_helper


async def create_employee(employee_data):
    async with db_helper.session_context() as session:
        employee = Employee(
            first_name=employee_data["first_name"],
            last_name=employee_data["last_name"],
            middle_name=employee_data["middle_name"],
            camera_user_id=employee_data.get("camera_user_id"),
        )
        session.add(employee)
        await session.commit()
        return {
            "id": employee.id,
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "middle_name": employee.middle_name,
            "camera_user_id": employee.camera_user_id,
        }

async def get_employee(employee_id: int):
    async with db_helper.session_context() as session:
        result = await session.execute(
            select(Employee).where(Employee.id == employee_id)
        )
        employee = result.scalar_one_or_none()
        if employee is None:
            return None
        return {
            "id": employee.id,
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "middle_name": employee.middle_name,
            "camera_user_id": employee.camera_user_id,
        }   
    
async def list_employees():
    async with db_helper.session_context() as session:
        result = await session.execute(select(Employee))
        employees = result.scalars().all()
        return [
            {
                "id": employee.id,
                "first_name": employee.first_name,
                "last_name": employee.last_name,
                "middle_name": employee.middle_name,
                "camera_user_id": employee.camera_user_id,
            }
            for employee in employees
        ]
    


async def update_employee(employee_id, employee_data):
    async with db_helper.session_context() as session:
        result = await session.execute(
            select(Employee).where(Employee.id == employee_id)
        )
        employee = result.scalar_one_or_none()
        if employee is None:
            return None
        for key, value in employee_data.items():
            setattr(employee, key, value)
        await session.commit()
        return {
            "id": employee.id,
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "middle_name": employee.middle_name,
            "camera_user_id": employee.camera_user_id,
        }
    
