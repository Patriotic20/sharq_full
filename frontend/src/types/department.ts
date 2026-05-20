export interface Department {
  id: number
  name: string
  created_at: string
  updated_at: string
  employees_count: number
}

export interface DepartmentBrief {
  id: number
  name: string
}

export interface DepartmentCreate {
  name: string
}

export interface DepartmentUpdate {
  name?: string
}

export interface DepartmentListResponse {
  items: Department[]
  total: number
  page: number
  size: number
  pages: number
}
