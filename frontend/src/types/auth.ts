import type { User } from './user'

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface MeResponse {
  user: User
  permissions: string[]
}
