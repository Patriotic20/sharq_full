export interface Group {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export interface GroupCreate {
  name: string
}

export interface GroupUpdate {
  name?: string
}

export interface GroupListResponse {
  items: Group[]
  total: number
  page: number
  size: number
  pages: number
}
