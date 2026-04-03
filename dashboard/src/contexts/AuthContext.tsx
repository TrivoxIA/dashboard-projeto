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

// ── Helper: carrega org a partir do userId ───────────────────
async function fetchOrgAndRole(userId: string) {
  try {
    const { data: membership, error } = await supabase
      .from('organization_members')
      .select('organization_id, role, organizations(id, name, slug, logo_url, plan, is_active)')
      .eq('user_id', userId)
      .single()

    if (error || !membership) {
      console.error('Org lookup falhou:', error?.message ?? 'sem membership')
      return { org: null, orgId: null, role: null as UserRole | null }
    }

    const org = membership.organizations as unknown as Organization | null
    return {
      org: org ? { ...org, id: membership.organization_id } : null,
      orgId: membership.organization_id as string,
      role: membership.role as UserRole,
    }
  } catch (e) {
    console.error('Exceção em fetchOrgAndRole:', e)
    return { org: null, orgId: null, role: null as UserRole | null }
  }
}

// ── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]                 = useState<User | null>(null)
  const [session, setSession]           = useState<Session | null>(null)
  const [loading, setLoading]           = useState(true)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [organizationId, setOrgId]      = useState<string | null>(null)
  const [userRole, setUserRole]         = useState<UserRole | null>(null)

  const applyOrg = useCallback((orgId: string | null, org: Organization | null, role: UserRole | null) => {
    setOrgId(orgId)
    setCurrentOrgId(orgId)
    setOrganization(org)
    setUserRole(role)
  }, [])

  const clearAll = useCallback(() => {
    setUser(null)
    setSession(null)
    applyOrg(null, null, null)
  }, [applyOrg])

  // Inicialização: getSession + listener
  useEffect(() => {
    let ignore = false

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (ignore) return

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const { org, orgId, role } = await fetchOrgAndRole(session.user.id)
          if (!ignore) applyOrg(orgId, org, role)
        }
      } catch (e) {
        console.error('Auth init falhou:', e)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (ignore) return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const { org, orgId, role } = await fetchOrgAndRole(session.user.id)
        if (!ignore) applyOrg(orgId, org, role)
      } else {
        applyOrg(null, null, null)
      }

      setLoading(false)
    })

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [applyOrg])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    clearAll()
    await supabase.auth.signOut()
  }

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
