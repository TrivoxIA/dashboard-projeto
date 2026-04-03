import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Se fornecido, apenas esses roles podem acessar a rota */
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, loading, userRole } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#18181b] flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-cyan-500 animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // Se há restrição de role e o usuário não tem permissão
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
