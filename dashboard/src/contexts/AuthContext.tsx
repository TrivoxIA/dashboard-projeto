import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { setCurrentOrgId } from '@/lib/api'

// ── Tipos ────────────────────────────────────────────────────
export type UserRole = 'super_admin' | 'admin' | 'agent' | 'viewer'

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  plan: string | null
  is_active: boolean
}

export interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  organization: Organization | null
  organizationId: string | null
  userRole: UserRole | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  hasRole: (...roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]                 = useState<User | null>(null)
  const [session, setSession]           = useState<Session | null>(null)
  const [loading, setLoading]           = useState(true)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [organizationId, setOrgId]      = useState<string | null>(null)
  const [userRole, setUserRole]         = useState<UserRole | null>(null)

  /** Carrega org + role do usuário logado */
  const loadOrgAndRole = useCallback(async (userId: string) => {
    try {
      // Busca membership do usuário
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', userId)
        .limit(1)
        .single()

      if (!membership) {
        console.warn('Usuário sem organização vinculada')
        return
      }

      setOrgId(membership.organization_id)
      setCurrentOrgId(membership.organization_id)
      setUserRole(membership.role as UserRole)

      // Busca dados da organização
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, slug, logo_url, plan, is_active')
        .eq('id', membership.organization_id)
        .single()

      if (org) setOrganization(org as Organization)
    } catch (e) {
      console.error('Erro ao carregar organização', e)
    }
  }, [])

  const clearOrg = useCallback(() => {
    setOrganization(null)
    setOrgId(null)
    setCurrentOrgId(null)
    setUserRole(null)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      if (data.session?.user) {
        await loadOrgAndRole(data.session.user.id)
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadOrgAndRole(session.user.id)
      } else {
        clearOrg()
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [loadOrgAndRole, clearOrg])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    clearOrg()
    await supabase.auth.signOut()
  }

  /** Verifica se o usuário tem um dos roles fornecidos */
  const hasRole = useCallback((...roles: UserRole[]) => {
    if (!userRole) return false
    return roles.includes(userRole)
  }, [userRole])

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      organization, organizationId, userRole,
      signIn, signOut, hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
