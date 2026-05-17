export interface Employee {
  id: number
  first_name: string
  last_name: string
  middle_name: string
  camera_user_id: string | null
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

export interface EmployeeUpdate {
  first_name?: string
  last_name?: string
  middle_name?: string
  camera_user_id?: string | null
}
