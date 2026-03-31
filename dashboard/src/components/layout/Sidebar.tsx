import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import {
  Bot,
  LayoutDashboard,
  Users,
  MessageSquare,
  Contact,
  GitBranch,
  BarChart2,
  Settings,
  LogOut,
} from 'lucide-react'

interface NavItem {
  label: string
  icon: React.ElementType
  to: string
  disabled?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard',      icon: LayoutDashboard, to: '/' },
  { label: 'Agentes',        icon: Users,           to: '/agentes' },
  { label: 'Conversas',      icon: MessageSquare,   to: '/conversas' },
  { label: 'Contatos',       icon: Contact,         to: '/contatos' },
  { label: 'Fluxos',         icon: GitBranch,       to: '/fluxos' },
  { label: 'Analytics',      icon: BarChart2,       to: '/analytics' },
  { label: 'Configurações',  icon: Settings,        to: '/configuracoes' },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-[#0d0d1a] border-r border-white/[0.05]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.05]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/30">
          <Bot className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase leading-none mb-0.5">
            CRM
          </p>
          <h1 className="text-sm font-bold text-white leading-none">Agente SDR</h1>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] text-slate-600 font-semibold tracking-wider uppercase px-2 mb-2">
          Menu
        </p>
        {navItems.map((item) => {
          const Icon = item.icon
          if (item.disabled) {
            return (
              <div
                key={item.to}
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-slate-600 cursor-not-allowed select-none"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-sm">{item.label}</span>
                <span className="ml-auto text-[10px] bg-white/5 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                  Em breve
                </span>
              </div>
            )
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors text-sm',
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-white/[0.05]">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <div className="h-7 w-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-emerald-400 uppercase">
              {user?.email?.[0] ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.email ?? ''}</p>
            <p className="text-[10px] text-slate-500">Admin</p>
          </div>
          <button
            onClick={() => signOut()}
            className="text-slate-500 hover:text-red-400 transition-colors"
            title="Sair"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
