import { useAuth } from '../context/AuthContext'

interface Props {
  code: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGate({ code, children, fallback = null }: Props) {
  const { hasPermission } = useAuth()
  if (!hasPermission(code)) return <>{fallback}</>
  return <>{children}</>
}
