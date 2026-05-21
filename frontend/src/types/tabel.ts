import type { AttendanceStatus, LeaveType } from './attendance'

export interface TabelDayCell {
  date: string                // YYYY-MM-DD
  code: string
  is_holiday: boolean
  is_weekend: boolean
  attendance_id: number | null
  status: AttendanceStatus | null
  leave_type: LeaveType | null
}

export interface TabelEmployeeRow {
  employee_id: number
  full_name: string
  position: string | null
  employment_rate: number
  days: TabelDayCell[]
  worked_days: number
}

export interface TabelData {
  year: number
  month: number
  month_name: string
  days_in_month: number
  working_days: number
  org_name: string
  rector_name: string
  kafedra_name: string
  holiday_dates: string[]
  employees: TabelEmployeeRow[]
}

export const TABEL_CODES = ['B', 'O', 'A', 'F', 'V', 'G', 'N', 'RP', 'R', 'OU', 'P'] as const
export type TabelCode = typeof TABEL_CODES[number]

export const CODE_LABEL: Record<TabelCode, string> = {
  B:  'Ishlangan',
  O:  'Bayramda ishlangan',
  A:  'Dam olish',
  F:  'Kasallik',
  V:  "Ma'muriyat ruxsati",
  G:  "O'quv ta'tili",
  N:  "O'qish dam olish",
  RP: "Yillik ta'til",
  R:  "Tug'ish ta'tili",
  OU: 'Davlat majburiyati',
  P:  'Progul',
}

export const CODE_TO_STATE: Record<TabelCode, { status: AttendanceStatus; leave_type: LeaveType | null }> = {
  B:  { status: 'present', leave_type: null },
  O:  { status: 'present', leave_type: null },
  A:  { status: 'absent',  leave_type: null },
  F:  { status: 'absent',  leave_type: 'sick' },
  V:  { status: 'absent',  leave_type: 'admin_absence' },
  G:  { status: 'absent',  leave_type: 'vacation_education' },
  N:  { status: 'absent',  leave_type: 'leave_education' },
  RP: { status: 'absent',  leave_type: 'vacation_annual' },
  R:  { status: 'absent',  leave_type: 'maternity' },
  OU: { status: 'absent',  leave_type: 'state_duty' },
  P:  { status: 'absent',  leave_type: null },
}
