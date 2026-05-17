export type CameraType = 'enter' | 'exit'

export interface Camera {
  id: number
  ip_address: string
  login: string
  type: CameraType
  created_at: string
  updated_at: string
}

export interface CameraListResponse {
  items: Camera[]
  total: number
  page: number
  size: number
  pages: number
}

export interface CameraCreate {
  ip_address: string
  login: string
  password: string
  type: CameraType
}

export interface CameraUpdate {
  ip_address?: string
  login?: string
  password?: string
  type?: CameraType
}
