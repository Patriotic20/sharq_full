import { request } from './client'
import type {
  PasswordChange,
  User,
  UserCreate,
  UserListResponse,
  UserUpdate,
} from '../types/user'

export interface UserListParams {
  page?: number
  size?: number
  username?: string
  role_id?: number
  is_active?: boolean
}

export function listUsers(params: UserListParams = {}): Promise<UserListResponse> {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.size) q.set('size', String(params.size))
  if (params.username) q.set('username', params.username)
  if (params.role_id !== undefined) q.set('role_id', String(params.role_id))
  if (params.is_active !== undefined) q.set('is_active', String(params.is_active))
  return request(`/users/?${q}`)
}

export function getUser(id: number): Promise<User> {
  return request(`/users/${id}`)
}

export function createUser(data: UserCreate): Promise<User> {
  return request('/users/', { method: 'POST', body: JSON.stringify(data) })
}

export function updateUser(id: number, data: UserUpdate): Promise<User> {
  return request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function changeUserPassword(id: number, data: PasswordChange): Promise<void> {
  return request(`/users/${id}/password`, { method: 'POST', body: JSON.stringify(data) })
}

export function deleteUser(id: number): Promise<void> {
  return request(`/users/${id}`, { method: 'DELETE' })
}
