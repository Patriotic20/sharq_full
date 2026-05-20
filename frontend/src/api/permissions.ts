import { request } from './client'
import type { PermissionListResponse } from '../types/permission'

export function listPermissions(): Promise<PermissionListResponse> {
  return request('/permissions/')
}
