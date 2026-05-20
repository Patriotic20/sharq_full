import { request } from './client'
import type { Role, RoleCreate, RoleListResponse, RoleUpdate, RoleWithPermissions } from '../types/role'

export interface RoleListParams {
  page?: number
  size?: number
}

export function listRoles(params: RoleListParams = {}): Promise<RoleListResponse> {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.size) q.set('size', String(params.size))
  return request(`/roles/?${q}`)
}

export function getRole(id: number): Promise<Role> {
  return request(`/roles/${id}`)
}

export function getRoleWithPermissions(id: number): Promise<RoleWithPermissions> {
  return request(`/roles/${id}/permissions`)
}

export function createRole(data: RoleCreate): Promise<Role> {
  return request('/roles/', { method: 'POST', body: JSON.stringify(data) })
}

export function updateRole(id: number, data: RoleUpdate): Promise<Role> {
  return request(`/roles/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deleteRole(id: number): Promise<void> {
  return request(`/roles/${id}`, { method: 'DELETE' })
}
