export type AttendanceStatus = 'present' | 'absent' | 'late' | 'left_early'
export type PresenceStatus = 'complete' | 'no_exit' | 'no_entry'

export interface EmployeeBrief {
  id: number
  first_name: string
  last_name: string
  middle_name: string
}

export interface CameraBrief {
  id: number
  ip_address: string
}

export interface Attendance {
  id: number
  employee_id: number
  employee: EmployeeBrief
  enter_time: string | null
  enter_camera: CameraBrief | null
  enter_rec_no: number | null
  exit_time: string | null
  exit_camera: CameraBrief | null
  exit_rec_no: number | null
  status: AttendanceStatus
  presence_status: PresenceStatus | null
  created_at: string
  updated_at: string
}

export interface AttendanceListResponse {
  items: Attendance[]
  total: number
  page: number
  size: number
  pages: number
}

export interface AttendanceUpdate {
  status?: AttendanceStatus
  presence_status?: PresenceStatus | null
  enter_time?: string | null
  exit_time?: string | null
  enter_camera_id?: number | null
  exit_camera_id?: number | null
}
