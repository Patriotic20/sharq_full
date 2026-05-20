import { request, tokenStore } from './client'
import type { MeResponse, TokenPair } from '../types/auth'

export async function login(username: string, password: string): Promise<TokenPair> {
  const body = new URLSearchParams()
  body.set('username', username)
  body.set('password', password)
  const data = await request<TokenPair>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    raw: true,
    skipAuth: true,
    skipRefresh: true,
  })
  tokenStore.setTokens(data.access_token, data.refresh_token)
  return data
}

export function me(): Promise<MeResponse> {
  return request('/auth/me')
}
