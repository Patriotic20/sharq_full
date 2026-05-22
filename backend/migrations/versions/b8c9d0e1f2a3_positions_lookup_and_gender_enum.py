"""positions lookup table + gender enum + replace position columns with FK

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-05-22 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b8c9d0e1f2a3"
down_revision: Union[str, Sequence[str], None] = "a7b8c9d0e1f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


gender_enum = sa.Enum("erkak", "ayol", name="gender")


def upgrade() -> None:
    # 1. positions lookup table
    op.create_table(
        "positions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=150), nullable=False),
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
        sa.UniqueConstraint("name", name="uq_positions_name"),
    )
    op.create_index("ix_positions_name", "positions", ["name"])

    # 2. employees: drop position (String), add position_id (FK)
    op.drop_column("employees", "position")
    op.add_column(
        "employees",
        sa.Column("position_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_employees_position_id_positions",
        "employees",
        "positions",
        ["position_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_employees_position_id", "employees", ["position_id"])

    # 3. employe_info: drop position (String), add position_id (FK)
    op.drop_column("employe_info", "position")
    op.add_column(
        "employe_info",
        sa.Column("position_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_employe_info_position_id_positions",
        "employe_info",
        "positions",
        ["position_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_employe_info_position_id", "employe_info", ["position_id"]
    )

    # 4. employe_info: replace gender String(10) with Enum('erkak','ayol')
    gender_enum.create(op.get_bind(), checkfirst=True)
    op.drop_column("employe_info", "gender")
    op.add_column(
        "employe_info",
        sa.Column(
            "gender",
            sa.Enum("erkak", "ayol", name="gender", create_type=False),
            nullable=True,
        ),
    )


def downgrade() -> None:
    # 4. revert gender: enum -> String(10)
    op.drop_column("employe_info", "gender")
    op.add_column(
        "employe_info",
        sa.Column("gender", sa.String(length=10), nullable=True),
    )
    sa.Enum(name="gender").drop(op.get_bind(), checkfirst=True)

    # 3. revert employe_info.position_id -> position String(150)
    op.drop_index("ix_employe_info_position_id", table_name="employe_info")
    op.drop_constraint(
        "fk_employe_info_position_id_positions",
        "employe_info",
        type_="foreignkey",
    )
    op.drop_column("employe_info", "position_id")
    op.add_column(
        "employe_info",
        sa.Column("position", sa.String(length=150), nullable=True),
    )

    # 2. revert employees.position_id -> position String(100)
    op.drop_index("ix_employees_position_id", table_name="employees")
    op.drop_constraint(
        "fk_employees_position_id_positions",
        "employees",
        type_="foreignkey",
    )
    op.drop_column("employees", "position_id")
    op.add_column(
        "employees",
        sa.Column("position", sa.String(length=100), nullable=True),
    )

    # 1. drop positions table
    op.drop_index("ix_positions_name", table_name="positions")
    op.drop_table("positions")
