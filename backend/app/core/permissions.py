from dataclasses import dataclass


@dataclass(frozen=True)
class PermissionDef:
    code: str
    description: str


PERMISSIONS: tuple[PermissionDef, ...] = (
    PermissionDef("users:read", "View users"),
    PermissionDef("users:write", "Create users"),
    PermissionDef("users:update", "Update users"),
    PermissionDef("users:delete", "Delete users"),
    PermissionDef("roles:read", "View roles"),
    PermissionDef("roles:write", "Create roles"),
    PermissionDef("roles:update", "Update roles"),
    PermissionDef("roles:delete", "Delete roles"),
    PermissionDef("permissions:read", "View permissions"),
    PermissionDef("role_permissions:update", "Assign permissions to roles"),
    PermissionDef("role_permissions:delete", "Revoke permissions from roles"),
    PermissionDef("employees:read", "View employees"),
    PermissionDef("employees:update", "Update employees"),
    PermissionDef("employees:delete", "Delete employees"),
    PermissionDef("departments:read", "View departments"),
    PermissionDef("departments:write", "Create departments"),
    PermissionDef("departments:update", "Update departments"),
    PermissionDef("departments:delete", "Delete departments"),
    PermissionDef("groups:read", "View groups"),
    PermissionDef("groups:write", "Create groups"),
    PermissionDef("groups:update", "Update groups"),
    PermissionDef("groups:delete", "Delete groups"),
    PermissionDef("attendances:read", "View attendances"),
    PermissionDef("attendances:update", "Update attendances"),
    PermissionDef("attendances:delete", "Delete attendances"),
    PermissionDef("cameras:read", "View cameras"),
    PermissionDef("cameras:write", "Create cameras"),
    PermissionDef("cameras:update", "Update cameras"),
    PermissionDef("cameras:delete", "Delete cameras"),
    PermissionDef("work_schedules:read", "View work schedules"),
    PermissionDef("work_schedules:write", "Create work schedules"),
    PermissionDef("work_schedules:update", "Update work schedules"),
    PermissionDef("work_schedules:delete", "Delete work schedules"),
    PermissionDef("holidays:read", "View holidays"),
    PermissionDef("holidays:write", "Manage holidays"),
    PermissionDef("holidays:delete", "Delete holidays"),
    PermissionDef("reports:read", "Generate reports"),
)


ROLE_PRESETS: dict[str, tuple[str, ...]] = {
    "admin": tuple(p.code for p in PERMISSIONS),
}
