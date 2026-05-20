import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { login as apiLogin, me as apiMe } from '../api/auth'
import { LOGOUT_EVENT_NAME, tokenStore } from '../api/client'
import type { User } from '../types/user'

interface AuthContextValue {
  user: User | null
  permissions: Set<string>
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  hasPermission: (code: string) => boolean
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface Props {
  children: React.ReactNode
}

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  const applyMe = useCallback(async () => {
    const data = await apiMe()
    setUser(data.user)
    setPermissions(new Set(data.permissions))
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    setPermissions(new Set())
  }, [])

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      if (!tokenStore.getAccess()) {
        setIsLoading(false)
        return
      }
      try {
        await applyMe()
      } catch {
        if (!cancelled) {
          tokenStore.clear()
          setUser(null)
          setPermissions(new Set())
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    bootstrap()
    return () => { cancelled = true }
  }, [applyMe])

  useEffect(() => {
    window.addEventListener(LOGOUT_EVENT_NAME, logout)
    return () => window.removeEventListener(LOGOUT_EVENT_NAME, logout)
  }, [logout])

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true)
    try {
      await apiLogin(username, password)
      await applyMe()
    } finally {
      setIsLoading(false)
    }
  }, [applyMe])

  const hasPermission = useCallback((code: string) => permissions.has(code), [permissions])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    permissions,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission,
    refreshMe: applyMe,
  }), [user, permissions, isLoading, login, logout, hasPermission, applyMe])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
