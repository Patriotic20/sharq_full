export interface Permission {
  id: number
  code: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface PermissionListResponse {
  items: Permission[]
  total: number
}
