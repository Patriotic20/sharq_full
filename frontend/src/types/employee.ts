import type { DepartmentBrief } from './department'
import type { PositionBrief } from './position'

export interface Employee {
  id: number
  first_name: string
  last_name: string
  middle_name: string
  camera_user_id: string | null
  department_id: number | null
  department: DepartmentBrief | null
  employment_rate: number
  position_id: number | null
  position: PositionBrief | null
  created_at: string
  updated_at: string
}

export interface EmployeeListResponse {
  items: Employee[]
  total: number
  page: number
  size: number
  pages: number
}

export interface EmployeeCreate {
  first_name: string
  last_name: string
  middle_name: string
  camera_user_id?: string | null
}

export interface EmployeeUpdate {
  first_name?: string
  last_name?: string
  middle_name?: string
  camera_user_id?: string | null
  department_id?: number | null
  employment_rate?: number
  position_id?: number | null
}
