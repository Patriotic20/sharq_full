import { request } from './client'
import type {
  RecomputeResult,
  WorkSchedule,
  WorkScheduleCreate,
  WorkScheduleListParams,
  WorkScheduleListResponse,
  WorkScheduleUpdate,
} from '../types/settings'

function buildQuery(params: WorkScheduleListParams): string {
  const sp = new URLSearchParams()
  if (params.page !== undefined) sp.set('page', String(params.page))
  if (params.size !== undefined) sp.set('size', String(params.size))
  if (params.name) sp.set('name', params.name)
  if (params.order) sp.set('order', params.order)
  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

export function listWorkSchedules(
  params: WorkScheduleListParams = {},
): Promise<WorkScheduleListResponse> {
  return request(`/settings/work-schedules/${buildQuery(params)}`)
}

export function getWorkSchedule(id: number): Promise<WorkSchedule> {
  return request(`/settings/work-schedules/${id}`)
}

export function createWorkSchedule(data: WorkScheduleCreate): Promise<WorkSchedule> {
  return request('/settings/work-schedules/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateWorkSchedule(
  id: number,
  data: WorkScheduleUpdate,
): Promise<WorkSchedule> {
  return request(`/settings/work-schedules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteWorkSchedule(id: number): Promise<void> {
  return request(`/settings/work-schedules/${id}`, { method: 'DELETE' })
}

export function recomputeStatuses(): Promise<RecomputeResult> {
  return request('/settings/work-schedules/recompute', { method: 'POST' })
}
