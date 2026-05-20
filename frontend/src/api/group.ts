import { request } from './client'
import type { Group, GroupCreate, GroupListResponse, GroupUpdate } from '../types/group'

export interface GroupListParams {
  page?: number
  size?: number
  name?: string
  order?: 'asc' | 'desc'
}

export function listGroups(params: GroupListParams = {}): Promise<GroupListResponse> {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.size) q.set('size', String(params.size))
  if (params.name) q.set('name', params.name)
  if (params.order) q.set('order', params.order)
  return request(`/groups/?${q}`)
}

export function getGroup(id: number): Promise<Group> {
  return request(`/groups/${id}`)
}

export function createGroup(data: GroupCreate): Promise<Group> {
  return request('/groups/', { method: 'POST', body: JSON.stringify(data) })
}

export function updateGroup(id: number, data: GroupUpdate): Promise<Group> {
  return request(`/groups/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deleteGroup(id: number): Promise<void> {
  return request(`/groups/${id}`, { method: 'DELETE' })
}
