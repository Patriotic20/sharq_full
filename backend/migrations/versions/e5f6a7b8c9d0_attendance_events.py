"""attendance_events: per-pass timeline + worked_seconds summary

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-05-21 11:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, Sequence[str], None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. worked_seconds cache column on attendances.
    op.add_column(
        "attendances",
        sa.Column(
            "worked_seconds",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )

    # 2. Drop old per-pass UNIQUE constraints — dedup moves to attendance_events.
    op.drop_constraint(
        "uq_attendances_enter_cam_rec", "attendances", type_="unique"
    )
    op.drop_constraint(
        "uq_attendances_exit_cam_rec", "attendances", type_="unique"
    )

    # 3. attendance_events table.
    op.create_table(
        "attendance_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("attendance_id", sa.Integer(), nullable=False),
        sa.Column(
            "type",
            sa.Enum("enter", "exit", name="cameratype", create_type=False),
            nullable=False,
        ),
        sa.Column("event_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("camera_id", sa.Integer(), nullable=False),
        sa.Column("rec_no", sa.Integer(), nullable=False),
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
        sa.ForeignKeyConstraint(
            ["attendance_id"], ["attendances.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["camera_id"], ["cameras.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "camera_id", "rec_no", name="uq_attendance_events_cam_rec"
        ),
    )
    op.create_index(
        "ix_attendance_events_attendance_id",
        "attendance_events",
        ["attendance_id"],
    )
    op.create_index(
        "ix_attendance_events_event_time",
        "attendance_events",
        ["event_time"],
    )
    op.create_index(
        "ix_attendance_events_att_time",
        "attendance_events",
        ["attendance_id", "event_time"],
    )

    # 4. Backfill existing enter/exit pairs into events.
    op.execute(
        """
        INSERT INTO attendance_events
            (attendance_id, type, event_time, camera_id, rec_no, created_at, updated_at)
        SELECT id, 'enter', enter_time, enter_camera_id, enter_rec_no, now(), now()
        FROM attendances
        WHERE enter_time IS NOT NULL
          AND enter_camera_id IS NOT NULL
          AND enter_rec_no IS NOT NULL
        """
    )
    op.execute(
        """
        INSERT INTO attendance_events
            (attendance_id, type, event_time, camera_id, rec_no, created_at, updated_at)
        SELECT id, 'exit', exit_time, exit_camera_id, exit_rec_no, now(), now()
        FROM attendances
        WHERE exit_time IS NOT NULL
          AND exit_camera_id IS NOT NULL
          AND exit_rec_no IS NOT NULL
        """
    )

    # 5. Backfill worked_seconds for existing closed pairs.
    op.execute(
        """
        UPDATE attendances
        SET worked_seconds = GREATEST(0, EXTRACT(EPOCH FROM (exit_time - enter_time))::int)
        WHERE enter_time IS NOT NULL
          AND exit_time IS NOT NULL
          AND exit_time > enter_time
        """
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_attendance_events_att_time", table_name="attendance_events")
    op.drop_index("ix_attendance_events_event_time", table_name="attendance_events")
    op.drop_index(
        "ix_attendance_events_attendance_id", table_name="attendance_events"
    )
    op.drop_table("attendance_events")

    op.create_unique_constraint(
        "uq_attendances_exit_cam_rec",
        "attendances",
        ["exit_camera_id", "exit_rec_no"],
    )
    op.create_unique_constraint(
        "uq_attendances_enter_cam_rec",
        "attendances",
        ["enter_camera_id", "enter_rec_no"],
    )
    op.drop_column("attendances", "worked_seconds")
