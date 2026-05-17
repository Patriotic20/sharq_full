export interface WorkSchedule {
  id: number
  start_time: string // "HH:MM:SS"
  end_time: string
  late_threshold_minutes: number
  early_leave_threshold_minutes: number
  created_at: string
  updated_at: string
}

export interface WorkScheduleUpdate {
  start_time?: string
  end_time?: string
  late_threshold_minutes?: number
  early_leave_threshold_minutes?: number
}

export interface RecomputeResult {
  updated: number
}
