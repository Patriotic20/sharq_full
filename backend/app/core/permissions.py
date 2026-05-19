from dataclasses import dataclass


@dataclass(frozen=True)
class PermissionDef:
    code: str
    description: str


PERMISSIONS: tuple[PermissionDef, ...] = (
    PermissionDef("users:read", "View users"),
    PermissionDef("users:write", "Create or update users"),
    PermissionDef("users:delete", "Delete users"),
    PermissionDef("roles:read", "View roles"),
    PermissionDef("roles:write", "Create or update roles"),
    PermissionDef("roles:delete", "Delete roles"),
    PermissionDef("permissions:read", "View permissions"),
    PermissionDef("role_permissions:write", "Assign permissions to roles"),
    PermissionDef("employees:read", "View employees"),
    PermissionDef("employees:write", "Create or update employees"),
    PermissionDef("employees:delete", "Delete employees"),
    PermissionDef("attendances:read", "View attendances"),
    PermissionDef("attendances:write", "Update or delete attendances"),
    PermissionDef("cameras:read", "View cameras"),
    PermissionDef("cameras:write", "Create, update or delete cameras"),
    PermissionDef("work_schedules:read", "View work schedule"),
    PermissionDef("work_schedules:write", "Update work schedule"),
)


ROLE_PRESETS: dict[str, tuple[str, ...]] = {
    "admin": tuple(p.code for p in PERMISSIONS),
    "manager": (
        "users:read",
        "roles:read",
        "permissions:read",
        "employees:read",
        "employees:write",
        "attendances:read",
        "attendances:write",
        "cameras:read",
        "work_schedules:read",
    ),
    "user": (
        "employees:read",
        "attendances:read",
        "cameras:read",
        "work_schedules:read",
    ),
}
