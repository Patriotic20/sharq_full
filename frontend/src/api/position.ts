import { request } from './client'
import type {
  Position,
  PositionCreate,
  PositionListResponse,
  PositionUpdate,
} from '../types/position'

export interface PositionListParams {
  page?: number
  size?: number
  name?: string
  order?: 'asc' | 'desc'
}

export function listPositions(
  params: PositionListParams = {},
): Promise<PositionListResponse> {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.size) q.set('size', String(params.size))
  if (params.name) q.set('name', params.name)
  if (params.order) q.set('order', params.order)
  return request(`/positions/?${q}`)
}

export function getPosition(id: number): Promise<Position> {
  return request(`/positions/${id}`)
}

export function createPosition(data: PositionCreate): Promise<Position> {
  return request('/positions/', { method: 'POST', body: JSON.stringify(data) })
}

export function updatePosition(id: number, data: PositionUpdate): Promise<Position> {
  return request(`/positions/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deletePosition(id: number): Promise<void> {
  return request(`/positions/${id}`, { method: 'DELETE' })
}
