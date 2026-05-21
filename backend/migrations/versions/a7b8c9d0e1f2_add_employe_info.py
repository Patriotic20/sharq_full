"""add employe_info table

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-05-21 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, Sequence[str], None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "employe_info",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("employee_id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("nationality", sa.String(length=50), nullable=True),
        sa.Column("gender", sa.String(length=10), nullable=True),
        sa.Column("birth_date", sa.Date(), nullable=True),
        sa.Column("birth_place", sa.Text(), nullable=True),
        sa.Column("residence_address", sa.Text(), nullable=True),
        sa.Column("education", sa.String(length=50), nullable=True),
        sa.Column("graduated_from", sa.String(length=255), nullable=True),
        sa.Column("scientific_degree", sa.String(length=100), nullable=True),
        sa.Column("scientific_title", sa.String(length=100), nullable=True),
        sa.Column("work_experience", sa.Text(), nullable=True),
        sa.Column("department_id", sa.Integer(), nullable=True),
        sa.Column("position", sa.String(length=150), nullable=True),
        sa.Column("employment_rate", sa.Numeric(3, 2), nullable=True),
        sa.Column("state_awards", sa.Text(), nullable=True),
        sa.Column("foreign_languages", sa.String(length=255), nullable=True),
        sa.Column("party_membership", sa.String(length=100), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone_number", sa.String(length=32), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["employee_id"], ["employees.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["department_id"], ["departments.id"], ondelete="SET NULL"
        ),
        sa.UniqueConstraint("employee_id", name="uq_employe_info_employee_id"),
    )
    op.create_index(
        "ix_employe_info_employee_id", "employe_info", ["employee_id"]
    )
    op.create_index(
        "ix_employe_info_department_id", "employe_info", ["department_id"]
    )
    op.create_index("ix_employe_info_full_name", "employe_info", ["full_name"])


def downgrade() -> None:
    op.drop_index("ix_employe_info_full_name", table_name="employe_info")
    op.drop_index("ix_employe_info_department_id", table_name="employe_info")
    op.drop_index("ix_employe_info_employee_id", table_name="employe_info")
    op.drop_table("employe_info")
