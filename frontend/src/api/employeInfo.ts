import { request } from './client'
import type {
  EmployeeInfo,
  EmployeeInfoCreate,
  EmployeeInfoListResponse,
  EmployeeInfoUpdate,
} from '../types/employeInfo'

export interface EmployeeInfoListParams {
  page?: number
  size?: number
  full_name?: string
  department_id?: number
  employee_id?: number
  order?: 'asc' | 'desc'
}

export function listEmployeeInfo(
  params: EmployeeInfoListParams = {},
): Promise<EmployeeInfoListResponse> {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.size) q.set('size', String(params.size))
  if (params.full_name) q.set('full_name', params.full_name)
  if (params.department_id !== undefined) q.set('department_id', String(params.department_id))
  if (params.employee_id !== undefined) q.set('employee_id', String(params.employee_id))
  if (params.order) q.set('order', params.order)
  return request(`/employe-info/?${q}`)
}

export function getEmployeeInfo(id: number): Promise<EmployeeInfo> {
  return request(`/employe-info/${id}`)
}

export function createEmployeeInfo(data: EmployeeInfoCreate): Promise<EmployeeInfo> {
  return request('/employe-info/', { method: 'POST', body: JSON.stringify(data) })
}

export function updateEmployeeInfo(
  id: number,
  data: EmployeeInfoUpdate,
): Promise<EmployeeInfo> {
  return request(`/employe-info/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deleteEmployeeInfo(id: number): Promise<void> {
  return request(`/employe-info/${id}`, { method: 'DELETE' })
}
