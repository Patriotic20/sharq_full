import { request } from './client'
import type { RoleWithPermissions } from '../types/role'

interface AssignBody {
  permission_ids: number[]
}

export function replaceRolePermissions(
  roleId: number,
  permission_ids: number[],
): Promise<RoleWithPermissions> {
  const body: AssignBody = { permission_ids }
  return request(`/roles/${roleId}/permissions/`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function assignRolePermissions(
  roleId: number,
  permission_ids: number[],
): Promise<RoleWithPermissions> {
  const body: AssignBody = { permission_ids }
  return request(`/roles/${roleId}/permissions/assign`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function revokeRolePermissions(
  roleId: number,
  permission_ids: number[],
): Promise<RoleWithPermissions> {
  const body: AssignBody = { permission_ids }
  return request(`/roles/${roleId}/permissions/revoke`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
