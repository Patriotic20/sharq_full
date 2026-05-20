import { request } from './client'
import type { Camera, CameraCreate, CameraListResponse, CameraUpdate } from '../types/camera'

export interface ListParams {
  page?: number
  size?: number
  ip_address?: string
  login?: string
  type?: string
}

export function listCameras(params: ListParams = {}): Promise<CameraListResponse> {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.size) q.set('size', String(params.size))
  if (params.ip_address) q.set('ip_address', params.ip_address)
  if (params.login) q.set('login', params.login)
  if (params.type) q.set('type', params.type)
  return request(`/cameras/?${q}`)
}

export function createCamera(data: CameraCreate): Promise<Camera> {
  return request('/cameras/', { method: 'POST', body: JSON.stringify(data) })
}

export function updateCamera(id: number, data: CameraUpdate): Promise<Camera> {
  return request(`/cameras/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deleteCamera(id: number): Promise<void> {
  return request(`/cameras/${id}`, { method: 'DELETE' })
}
