import type { Employee, EmployeeListResponse, EmployeeUpdate } from '../types/employee'

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

export interface EmployeeListParams {
  page?: number
  size?: number
  first_name?: string
  last_name?: string
  camera_user_id?: string
}

export function listEmployees(params: EmployeeListParams = {}): Promise<EmployeeListResponse> {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.size) q.set('size', String(params.size))
  if (params.first_name) q.set('first_name', params.first_name)
  if (params.last_name) q.set('last_name', params.last_name)
  if (params.camera_user_id) q.set('camera_user_id', params.camera_user_id)
  return request(`/employees/?${q}`)
}

export function updateEmployee(id: number, data: EmployeeUpdate): Promise<Employee> {
  return request(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deleteEmployee(id: number): Promise<void> {
  return request(`/employees/${id}`, { method: 'DELETE' })
}
