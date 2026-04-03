import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  plan: string
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  organization: Organization | null
  organizationId: string | null
  userRole: string | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  hasRole: (...roles: string[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    async function init() {
      try {
        const { data } = await supabase.auth.getSession()
        if (ignore) return

        setSession(data.session)
        setUser(data.session?.user ?? null)

        if (data.session?.user) {
          await loadOrg(data.session.user.id)
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    async function loadOrg(userId: string) {
      try {
        const { data, error } = await supabase
          .from('organization_members')
          .select('organization_id, role, organizations(id, name, slug, logo_url, plan)')
          .eq('user_id', userId)
          .single()

        if (error || !data) {
          console.error('Org load error:', error)
          return
        }

        if (!ignore) {
          const org = data.organizations as unknown as Organization
          setOrganization(org)
          setUserRole(data.role)
        }
      } catch (err) {
        console.error('Org load exception:', err)
      }
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (ignore) return
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await loadOrg(session.user.id)
      } else {
        setOrganization(null)
        setUserRole(null)
      }
    })

    return () => {
      ignore = true
      listener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    setOrganization(null)
    setUserRole(null)
    await supabase.auth.signOut()
  }

  const hasRole = (...roles: string[]) => {
    if (!userRole) return false
    return roles.includes(userRole)
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      organization,
      organizationId: organization?.id ?? null,
      userRole,
      signIn,
      signOut,
      hasRole
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
