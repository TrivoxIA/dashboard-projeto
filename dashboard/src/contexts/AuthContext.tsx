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
  ready: boolean
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
  const [orgLoaded, setOrgLoaded]       = useState(false)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [organizationId, setOrgId]      = useState<string | null>(null)
  const [userRole, setUserRole]         = useState<UserRole | null>(null)

  // ready = sessão carregada + org carregada (ou sem sessão)
  const ready = !loading && orgLoaded

  /** Carrega org + role do usuário logado (query única com join) */
  const loadOrgAndRole = useCallback(async (userId: string) => {
    try {
      const { data: membership, error } = await supabase
        .from('organization_members')
        .select('organization_id, role, organizations(id, name, slug, logo_url, plan, is_active)')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Erro ao buscar organization_members:', error.message)
        return
      }

      if (!membership) {
        console.warn('Usuário sem organização vinculada')
        return
      }

      setOrgId(membership.organization_id)
      setCurrentOrgId(membership.organization_id)
      setUserRole(membership.role as UserRole)

      const org = membership.organizations as unknown as Organization | null
      if (org) {
        setOrganization({ ...org, id: membership.organization_id })
      }
    } catch (e) {
      console.error('Exceção ao carregar organização:', e)
    } finally {
      setOrgLoaded(true)
    }
  }, [])

  const clearOrg = useCallback(() => {
    setOrganization(null)
    setOrgId(null)
    setCurrentOrgId(null)
    setUserRole(null)
    setOrgLoaded(true)
  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      try {
        setSession(data.session)
        setUser(data.session?.user ?? null)
        if (data.session?.user) {
          await loadOrgAndRole(data.session.user.id)
        } else {
          setOrgLoaded(true)
        }
      } catch (e) {
        console.error('Erro na inicialização do auth:', e)
        setOrgLoaded(true)
      } finally {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      try {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          setOrgLoaded(false)
          await loadOrgAndRole(session.user.id)
        } else {
          clearOrg()
        }
      } catch (e) {
        console.error('Erro no onAuthStateChange:', e)
        setOrgLoaded(true)
      } finally {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [loadOrgAndRole, clearOrg])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    clearOrg()
    await supabase.auth.signOut()
  }

  const hasRole = useCallback((...roles: UserRole[]) => {
    if (!userRole) return false
    return roles.includes(userRole)
  }, [userRole])

  return (
    <AuthContext.Provider value={{
      user, session, loading, ready,
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
