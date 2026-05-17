import type {
  RecomputeResult,
  WorkSchedule,
  WorkScheduleUpdate,
} from '../types/settings'

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
