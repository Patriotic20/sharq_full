import { request } from './client'
import type {
  RecomputeResult,
  WorkSchedule,
  WorkScheduleUpdate,
} from '../types/settings'

export function getSchedule(): Promise<WorkSchedule> {
  return request('/settings/work-schedule/')
}

export function updateSchedule(data: WorkScheduleUpdate): Promise<WorkSchedule> {
  return request('/settings/work-schedule/', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function recomputeStatuses(): Promise<RecomputeResult> {
  return request('/settings/work-schedule/recompute', { method: 'POST' })
}
