const BASE = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:8000/api/v1'

const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'
const LOGOUT_EVENT = 'auth:logout'

export const tokenStore = {
  getAccess(): string | null {
    return sessionStorage.getItem(ACCESS_KEY)
  },
  getRefresh(): string | null {
    return sessionStorage.getItem(REFRESH_KEY)
  },
  setTokens(access: string, refresh: string) {
    sessionStorage.setItem(ACCESS_KEY, access)
    sessionStorage.setItem(REFRESH_KEY, refresh)
  },
  setAccess(access: string) {
    sessionStorage.setItem(ACCESS_KEY, access)
  },
  clear() {
    sessionStorage.removeItem(ACCESS_KEY)
    sessionStorage.removeItem(REFRESH_KEY)
  },
}

export const LOGOUT_EVENT_NAME = LOGOUT_EVENT

function broadcastLogout() {
  tokenStore.clear()
  window.dispatchEvent(new Event(LOGOUT_EVENT))
}

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise

  const refresh = tokenStore.getRefresh()
  if (!refresh) {
    broadcastLogout()
    throw new Error('Sessiya tugagan')
  }

  refreshPromise = (async () => {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    })
    if (!res.ok) {
      broadcastLogout()
      throw new Error('Sessiyani yangilab bo\'lmadi')
    }
    const data = (await res.json()) as { access_token: string; refresh_token: string }
    tokenStore.setTokens(data.access_token, data.refresh_token)
    return data.access_token
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

interface RequestOptions extends RequestInit {
  raw?: boolean
  skipAuth?: boolean
  skipRefresh?: boolean
}

function buildHeaders(init: RequestOptions): HeadersInit {
  const headers = new Headers(init.headers)
  if (!init.raw && !headers.has('Content-Type') && init.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  if (!init.skipAuth) {
    const token = tokenStore.getAccess()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }
  return headers
}

export async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const doFetch = async (): Promise<Response> =>
    fetch(`${BASE}${path}`, { ...init, headers: buildHeaders(init) })

  let res = await doFetch()

  if (res.status === 401 && !init.skipRefresh && !init.skipAuth && tokenStore.getRefresh()) {
    try {
      await refreshAccessToken()
      res = await doFetch()
    } catch {
      // refresh failed → broadcastLogout already called
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    if (res.status === 401) broadcastLogout()
    throw new Error(err.detail ?? 'Request failed')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}
