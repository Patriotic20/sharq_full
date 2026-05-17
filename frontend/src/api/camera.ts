import type { Camera, CameraCreate, CameraListResponse, CameraUpdate } from '../types/camera'

const BASE = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:8000/api/v1'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail ?? 'Request failed')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

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
