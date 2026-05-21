"""work_schedule multi: name, applies_to_all, dept/group assignments

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-05-21 09:30:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. New columns on work_schedule (nullable first, fill, then NOT NULL).
    op.add_column(
        "work_schedule",
        sa.Column("name", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "work_schedule",
        sa.Column(
            "applies_to_all",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    # 2. Promote existing singleton (id=1) to default global schedule.
    op.execute(
        "UPDATE work_schedule "
        "SET name = 'По умолчанию', applies_to_all = true "
        "WHERE id = 1"
    )

    # 3. Enforce constraints.
    op.alter_column("work_schedule", "name", nullable=False)
    op.create_index(
        "ix_work_schedule_name",
        "work_schedule",
        ["name"],
        unique=True,
    )
    # Partial unique index — only one schedule can be applies_to_all=true.
    op.create_index(
        "ix_work_schedule_applies_to_all_singleton",
        "work_schedule",
        ["applies_to_all"],
        unique=True,
        postgresql_where=sa.text("applies_to_all = true"),
    )

    # 4. Association tables.
    op.create_table(
        "work_schedule_departments",
        sa.Column("work_schedule_id", sa.Integer(), nullable=False),
        sa.Column("department_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["work_schedule_id"], ["work_schedule.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["department_id"], ["departments.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("work_schedule_id", "department_id"),
        sa.UniqueConstraint(
            "department_id", name="uq_work_schedule_departments_department_id"
        ),
    )

    op.create_table(
        "work_schedule_groups",
        sa.Column("work_schedule_id", sa.Integer(), nullable=False),
        sa.Column("group_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["work_schedule_id"], ["work_schedule.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["group_id"], ["groups.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("work_schedule_id", "group_id"),
        sa.UniqueConstraint("group_id", name="uq_work_schedule_groups_group_id"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("work_schedule_groups")
    op.drop_table("work_schedule_departments")
    op.drop_index(
        "ix_work_schedule_applies_to_all_singleton", table_name="work_schedule"
    )
    op.drop_index("ix_work_schedule_name", table_name="work_schedule")
    op.drop_column("work_schedule", "applies_to_all")
    op.drop_column("work_schedule", "name")
