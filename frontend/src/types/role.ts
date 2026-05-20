import type { Permission } from './permission'

export interface Role {
  id: number
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[]
}

export interface RoleCreate {
  name: string
  description?: string | null
}

export interface RoleUpdate {
  name?: string
  description?: string | null
}

export interface RoleListResponse {
  items: Role[]
  total: number
  page: number
  size: number
  pages: number
}
