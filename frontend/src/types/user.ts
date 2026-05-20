import type { Role } from './role'

export interface User {
  id: number
  username: string
  full_name: string | null
  is_active: boolean
  role_id: number | null
  role: Role | null
  created_at: string
  updated_at: string
}

export interface UserCreate {
  username: string
  password: string
  full_name?: string | null
  is_active?: boolean
  role_id?: number | null
}

export interface UserUpdate {
  username?: string
  full_name?: string | null
  is_active?: boolean
  role_id?: number | null
}

export interface PasswordChange {
  new_password: string
}

export interface UserListResponse {
  items: User[]
  total: number
  page: number
  size: number
  pages: number
}
