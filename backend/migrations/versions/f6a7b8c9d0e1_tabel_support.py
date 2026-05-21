"""tabel support: employee rate/position, attendance leave_type, holidays

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-05-21 12:00:00.000000

"""
from typing import Sequence, Union
from datetime import date

from alembic import op
import sqlalchemy as sa


revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, Sequence[str], None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


leave_type_enum = sa.Enum(
    "sick",
    "vacation_annual",
    "vacation_education",
    "leave_education",
    "admin_absence",
    "state_duty",
    "maternity",
    name="leavetype",
)


def upgrade() -> None:
    # 1. Employee: employment_rate, position
    op.add_column(
        "employees",
        sa.Column(
            "employment_rate",
            sa.Numeric(3, 2),
            nullable=False,
            server_default="1.00",
        ),
    )
    op.add_column(
        "employees",
        sa.Column("position", sa.String(length=100), nullable=True),
    )

    # 2. Attendance: leave_type
    leave_type_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "attendances",
        sa.Column(
            "leave_type",
            sa.Enum(
                "sick",
                "vacation_annual",
                "vacation_education",
                "leave_education",
                "admin_absence",
                "state_duty",
                "maternity",
                name="leavetype",
                create_type=False,
            ),
            nullable=True,
        ),
    )
    op.create_index(
        op.f("ix_attendances_leave_type"), "attendances", ["leave_type"], unique=False
    )

    # 3. Holidays table
    op.create_table(
        "holidays",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column(
            "is_recurring",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_holidays")),
        sa.UniqueConstraint("date", name=op.f("uq_holidays_date")),
    )
    op.create_index(op.f("ix_holidays_date"), "holidays", ["date"], unique=False)

    # 4. Seed Uzbekistan state holidays (recurring)
    uz_holidays = [
        ("01-01", "Yangi yil"),
        ("01-14", "Vatan himoyachilari kuni"),
        ("03-08", "Xalqaro xotin-qizlar kuni"),
        ("03-21", "Navro'z"),
        ("05-09", "Xotira va qadrlash kuni"),
        ("09-01", "Mustaqillik kuni"),
        ("10-01", "O'qituvchi va murabbiylar kuni"),
        ("12-08", "Konstitutsiya kuni"),
    ]
    year = 2026
    holidays_table = sa.table(
        "holidays",
        sa.column("date", sa.Date()),
        sa.column("name", sa.String()),
        sa.column("is_recurring", sa.Boolean()),
    )
    op.bulk_insert(
        holidays_table,
        [
            {
                "date": date(year, int(md.split("-")[0]), int(md.split("-")[1])),
                "name": name,
                "is_recurring": True,
            }
            for md, name in uz_holidays
        ],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_holidays_date"), table_name="holidays")
    op.drop_table("holidays")
    op.drop_index(op.f("ix_attendances_leave_type"), table_name="attendances")
    op.drop_column("attendances", "leave_type")
    leave_type_enum.drop(op.get_bind(), checkfirst=True)
    op.drop_column("employees", "position")
    op.drop_column("employees", "employment_rate")
