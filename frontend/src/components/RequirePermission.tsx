import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface Props {
  code: string
  children: React.ReactNode
}

export function RequirePermission({ code, children }: Props) {
  const { hasPermission } = useAuth()
  if (!hasPermission(code)) {
    return <Navigate to="/forbidden" replace />
  }
  return <>{children}</>
}
