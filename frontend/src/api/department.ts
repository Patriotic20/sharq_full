import { request } from './client'
import type {
  Department,
  DepartmentCreate,
  DepartmentListResponse,
  DepartmentUpdate,
} from '../types/department'
import type { EmployeeListResponse } from '../types/employee'

export interface DepartmentListParams {
  page?: number
  size?: number
  name?: string
  order?: 'asc' | 'desc'
}

export function listDepartments(
  params: DepartmentListParams = {},
): Promise<DepartmentListResponse> {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.size) q.set('size', String(params.size))
  if (params.name) q.set('name', params.name)
  if (params.order) q.set('order', params.order)
  return request(`/departments/?${q}`)
}

export function getDepartment(id: number): Promise<Department> {
  return request(`/departments/${id}`)
}

export function createDepartment(data: DepartmentCreate): Promise<Department> {
  return request('/departments/', { method: 'POST', body: JSON.stringify(data) })
}

export function updateDepartment(id: number, data: DepartmentUpdate): Promise<Department> {
  return request(`/departments/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deleteDepartment(id: number): Promise<void> {
  return request(`/departments/${id}`, { method: 'DELETE' })
}

export interface DepartmentEmployeesParams {
  page?: number
  size?: number
  order?: 'asc' | 'desc'
}

export function listDepartmentEmployees(
  id: number,
  params: DepartmentEmployeesParams = {},
): Promise<EmployeeListResponse> {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.size) q.set('size', String(params.size))
  if (params.order) q.set('order', params.order)
  return request(`/departments/${id}/employees?${q}`)
}
