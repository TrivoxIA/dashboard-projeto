import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/contexts/AuthContext'
import logoTrivoxia from '@/assets/logo-trivoxia.png'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Contact,
  BarChart3,
  Settings,
  LogOut,
  Building2,
} from 'lucide-react'

interface NavItem {
  label: string
  icon: React.ElementType
  to: string
  /** Roles que podem ver este item. Vazio = todos */
  roles?: UserRole[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard',     icon: LayoutDashboard, to: '/' },
  { label: 'Agentes',       icon: Users,           to: '/agentes',      roles: ['super_admin', 'admin'] },
  { label: 'Conversas',     icon: MessageSquare,   to: '/conversas',    roles: ['super_admin', 'admin', 'agent'] },
  { label: 'Contatos',      icon: Contact,         to: '/contatos',     roles: ['super_admin', 'admin', 'agent'] },
  { label: 'Analytics',     icon: BarChart3,       to: '/analytics' },
  { label: 'Configurações', icon: Settings,        to: '/configuracoes', roles: ['super_admin', 'admin'] },
]

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin:       'Admin',
  agent:       'Agente',
  viewer:      'Viewer',
}

export default function Sidebar() {
  const { user, signOut, organization, userRole } = useAuth()

  const visibleItems = navItems.filter(item => {
    if (!item.roles) return true
    if (!userRole) return false
    return item.roles.includes(userRole)
  })

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-[#1f1f23] border-r border-zinc-700/50">
      {/* Logo + Org */}
      <div className="px-4 py-4 border-b border-zinc-700/50">
        <div className="flex items-center gap-3">
          <img src={logoTrivoxia} alt="TrivoxIA" className="h-8 w-8 object-contain shrink-0" />
          <span className="text-base font-semibold text-white tracking-tight">TrivoxIA</span>
        </div>
        {organization && (
          <div className="flex items-center gap-2 mt-3 px-1">
            <Building2 className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            <span className="text-xs text-zinc-400 truncate">{organization.name}</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-sm',
                  isActive
                    ? 'bg-zinc-700/60 text-cyan-400 font-medium'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-700/40'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-zinc-700/50">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl">
          <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-zinc-300 uppercase">
              {user?.email?.[0] ?? 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.email ?? 'Admin'}</p>
            {userRole && (
              <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 mt-0.5">
                {ROLE_LABELS[userRole]}
              </span>
            )}
          </div>
          <button
            onClick={() => signOut()}
            className="text-zinc-500 hover:text-red-400 transition-colors shrink-0"
            title="Sair"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
