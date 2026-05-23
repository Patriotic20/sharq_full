"""add employee status enum column

Revision ID: c9d0e1f2a3b4
Revises: b8c9d0e1f2a3
Create Date: 2026-05-23 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c9d0e1f2a3b4"
down_revision: Union[str, Sequence[str], None] = "b8c9d0e1f2a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


employee_status_enum = sa.Enum("worker", "student", name="employeestatus")


def upgrade() -> None:
    employee_status_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "employees",
        sa.Column(
            "status",
            sa.Enum("worker", "student", name="employeestatus", create_type=False),
            nullable=True,
        ),
    )
    op.create_index("ix_employees_status", "employees", ["status"])


def downgrade() -> None:
    op.drop_index("ix_employees_status", table_name="employees")
    op.drop_column("employees", "status")
    sa.Enum(name="employeestatus").drop(op.get_bind(), checkfirst=True)
