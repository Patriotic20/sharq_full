import { request } from './client'
import type { Attendance, AttendanceListResponse, AttendanceStatus, AttendanceUpdate, LeaveType } from '../types/attendance'

export interface AttendanceListParams {
  page?: number
  size?: number
  date?: string
  date_from?: string
  date_to?: string
  employee_id?: number
  status?: string
  presence_status?: string
}

export function listAttendances(params: AttendanceListParams = {}): Promise<AttendanceListResponse> {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.size) q.set('size', String(params.size))
  if (params.date) q.set('date', params.date)
  if (params.date_from) q.set('date_from', params.date_from)
  if (params.date_to) q.set('date_to', params.date_to)
  if (params.employee_id) q.set('employee_id', String(params.employee_id))
  if (params.status) q.set('status', params.status)
  if (params.presence_status) q.set('presence_status', params.presence_status)
  return request(`/attendances/?${q}`)
}

export interface AttendanceCreateBody {
  employee_id: number
  date: string                   // YYYY-MM-DD
  status: AttendanceStatus
  leave_type: LeaveType | null
}

export function createAttendance(body: AttendanceCreateBody): Promise<Attendance> {
  return request('/attendances/', { method: 'POST', body: JSON.stringify(body) })
}

export function updateAttendance(id: number, data: AttendanceUpdate): Promise<Attendance> {
  return request(`/attendances/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deleteAttendance(id: number): Promise<void> {
  return request(`/attendances/${id}`, { method: 'DELETE' })
}
