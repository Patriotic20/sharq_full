export type AttendanceStatus = 'present' | 'absent' | 'late' | 'left_early'
export type PresenceStatus = 'complete' | 'no_exit' | 'no_entry'
export type CameraType = 'enter' | 'exit'
export type LeaveType =
  | 'sick'
  | 'vacation_annual'
  | 'vacation_education'
  | 'leave_education'
  | 'admin_absence'
  | 'state_duty'
  | 'maternity'

export const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  sick: "Kasallik (F)",
  vacation_annual: "Yillik ta'til (RP)",
  vacation_education: "O'quv ta'tili (G)",
  leave_education: "O'qish dam olish (N)",
  admin_absence: "Ma'muriyat ruxsati (V)",
  state_duty: "Davlat majburiyati (OU)",
  maternity: "Tug'ish ta'tili (R)",
}

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

export interface AttendanceEvent {
  id: number
  type: CameraType
  event_time: string
  camera: CameraBrief | null
  rec_no: number
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
  leave_type: LeaveType | null
  worked_seconds: number
  events: AttendanceEvent[]
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
  leave_type?: LeaveType | null
  enter_time?: string | null
  exit_time?: string | null
  enter_camera_id?: number | null
  exit_camera_id?: number | null
}
