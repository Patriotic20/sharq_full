export interface Position {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export interface PositionBrief {
  id: number
  name: string
}

export interface PositionCreate {
  name: string
}

export interface PositionUpdate {
  name?: string
}

export interface PositionListResponse {
  items: Position[]
  total: number
  page: number
  size: number
  pages: number
}
