import { request } from './client'
import type { Attendance, AttendanceListResponse, AttendanceUpdate } from '../types/attendance'

export interface AttendanceListParams {
  page?: number
  size?: number
  date?: string
  employee_id?: number
  status?: string
  presence_status?: string
}

export function listAttendances(params: AttendanceListParams = {}): Promise<AttendanceListResponse> {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.size) q.set('size', String(params.size))
  if (params.date) q.set('date', params.date)
  if (params.employee_id) q.set('employee_id', String(params.employee_id))
  if (params.status) q.set('status', params.status)
  if (params.presence_status) q.set('presence_status', params.presence_status)
  return request(`/attendances/?${q}`)
}

export function updateAttendance(id: number, data: AttendanceUpdate): Promise<Attendance> {
  return request(`/attendances/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deleteAttendance(id: number): Promise<void> {
  return request(`/attendances/${id}`, { method: 'DELETE' })
}
