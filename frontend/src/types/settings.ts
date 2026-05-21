export interface DepartmentRef {
  id: number
  name: string
}

export interface GroupRef {
  id: number
  name: string
}

export interface WorkSchedule {
  id: number
  name: string
  start_time: string // "HH:MM:SS"
  end_time: string
  late_threshold_minutes: number
  early_leave_threshold_minutes: number
  applies_to_all: boolean
  departments: DepartmentRef[]
  groups: GroupRef[]
  created_at: string
  updated_at: string
}

export interface WorkScheduleCreate {
  name: string
  start_time: string
  end_time: string
  late_threshold_minutes: number
  early_leave_threshold_minutes: number
  applies_to_all: boolean
  department_ids: number[]
  group_ids: number[]
}

export interface WorkScheduleUpdate {
  name?: string
  start_time?: string
  end_time?: string
  late_threshold_minutes?: number
  early_leave_threshold_minutes?: number
  applies_to_all?: boolean
  department_ids?: number[]
  group_ids?: number[]
}

export interface WorkScheduleListResponse {
  items: WorkSchedule[]
  total: number
  page: number
  size: number
  pages: number
}

export interface WorkScheduleListParams {
  page?: number
  size?: number
  name?: string
  order?: 'asc' | 'desc'
}

export interface RecomputeResult {
  updated: number
}
