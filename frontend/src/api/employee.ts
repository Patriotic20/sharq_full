import { request } from './client'
import type { Employee, EmployeeCreate, EmployeeListResponse, EmployeeUpdate } from '../types/employee'

export interface EmployeeListParams {
  page?: number
  size?: number
  first_name?: string
  last_name?: string
  camera_user_id?: string
  department_id?: number
  order?: 'asc' | 'desc'
}

export function listEmployees(params: EmployeeListParams = {}): Promise<EmployeeListResponse> {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.size) q.set('size', String(params.size))
  if (params.first_name) q.set('first_name', params.first_name)
  if (params.last_name) q.set('last_name', params.last_name)
  if (params.camera_user_id) q.set('camera_user_id', params.camera_user_id)
  if (params.department_id !== undefined) q.set('department_id', String(params.department_id))
  if (params.order) q.set('order', params.order)
  return request(`/employees/?${q}`)
}

export function getEmployee(id: number): Promise<Employee> {
  return request(`/employees/${id}`)
}

export function createEmployee(data: EmployeeCreate): Promise<Employee> {
  return request('/employees/', { method: 'POST', body: JSON.stringify(data) })
}

export function updateEmployee(id: number, data: EmployeeUpdate): Promise<Employee> {
  return request(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deleteEmployee(id: number): Promise<void> {
  return request(`/employees/${id}`, { method: 'DELETE' })
}
