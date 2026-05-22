import type { DepartmentBrief } from './department'
import type { PositionBrief } from './position'

export type Gender = 'erkak' | 'ayol'

export interface EmployeeInfo {
  id: number
  employee_id: number
  full_name: string
  nationality: string | null
  gender: Gender | null
  birth_date: string | null
  birth_place: string | null
  residence_address: string | null
  education: string | null
  graduated_from: string | null
  scientific_degree: string | null
  scientific_title: string | null
  work_experience: string | null
  department_id: number | null
  department: DepartmentBrief | null
  position_id: number | null
  position: PositionBrief | null
  employment_rate: number | null
  state_awards: string | null
  foreign_languages: string | null
  party_membership: string | null
  email: string | null
  phone_number: string | null
  created_at: string
  updated_at: string
}

export interface EmployeeInfoCreate {
  employee_id: number
  full_name: string
  nationality?: string | null
  gender?: Gender | null
  birth_date?: string | null
  birth_place?: string | null
  residence_address?: string | null
  education?: string | null
  graduated_from?: string | null
  scientific_degree?: string | null
  scientific_title?: string | null
  work_experience?: string | null
  department_id?: number | null
  position_id?: number | null
  employment_rate?: number | null
  state_awards?: string | null
  foreign_languages?: string | null
  party_membership?: string | null
  email?: string | null
  phone_number?: string | null
}

export type EmployeeInfoUpdate = Omit<Partial<EmployeeInfoCreate>, 'employee_id'>

export interface EmployeeInfoListResponse {
  items: EmployeeInfo[]
  total: number
  page: number
  size: number
  pages: number
}
