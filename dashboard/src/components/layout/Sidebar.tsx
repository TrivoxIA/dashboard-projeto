import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import logoTrivoxia from '@/assets/logo-trivoxia.png'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Contact,
  Kanban,
  BarChart3,
  Settings,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react'

interface NavItem {
  label: string
  icon: React.ElementType
  to: string
  allowedRoles: string[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard',     icon: LayoutDashboard, to: '/',              allowedRoles: ['super_admin', 'admin', 'agent', 'viewer'] },
  { label: 'Conversas',     icon: MessageSquare,   to: '/conversas',     allowedRoles: ['super_admin', 'admin', 'agent'] },
  { label: 'Contatos',      icon: Contact,         to: '/contatos',      allowedRoles: ['super_admin', 'admin', 'agent'] },
  { label: 'Leads',         icon: Kanban,          to: '/leads',         allowedRoles: ['super_admin', 'admin', 'agent'] },
  { label: 'Agentes',       icon: Users,           to: '/agentes',       allowedRoles: ['super_admin', 'admin'] },
  { label: 'Analytics',     icon: BarChart3,       to: '/analytics',     allowedRoles: ['super_admin', 'admin', 'viewer'] },
  { label: 'Configurações', icon: Settings,        to: '/configuracoes', allowedRoles: ['super_admin', 'admin'] },
]

const roleLabels: Record<string, string> = {
  super_admin: 'super admin',
  admin: 'admin',
  agent: 'agente',
  viewer: 'viewer',
}

export default function Sidebar() {
  const { user, signOut, userRole } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-[var(--bg-sidebar)] border-r border-[var(--border-zinc)]">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <img src={logoTrivoxia} alt="TrivoxIA" className="h-8 w-8 rounded-lg object-contain shrink-0" />
          <span className="text-base font-semibold text-[var(--text-primary)] tracking-tight">TrivoxIA</span>
        </div>
        <div className="mt-2">
          {userRole ? (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--badge-text)' }}>
              {roleLabels[userRole] ?? userRole}
            </span>
          ) : (
            <div className="h-4 w-16 rounded bg-[var(--border-zinc)] animate-pulse" />
          )}
        </div>
      </div>
      <div className="mx-4 border-t border-[var(--border-strong)]" />

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.filter(item => !userRole || item.allowedRoles.includes(userRole)).map((item) => {
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
                    ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-medium'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--sidebar-hover-bg)]'
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
      <div className="px-2 py-3 border-t border-[var(--border-zinc)]">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl">
          <div className="h-8 w-8 rounded-full bg-[var(--border-zinc)] flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-[var(--text-primary)] uppercase">
              {user?.email?.[0] ?? 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--text-primary)] truncate">{user?.email ?? 'Admin'}</p>
            <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-[var(--sidebar-active-text)] mt-0.5">
              Pro
            </span>
          </div>
          <button
            onClick={toggleTheme}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => signOut()}
            className="text-[var(--text-tertiary)] hover:text-red-400 transition-colors shrink-0"
            title="Sair"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
