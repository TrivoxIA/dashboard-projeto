import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import logoTrivoxia from '@/assets/logo-trivoxia.png'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Contact,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react'

interface NavItem {
  label: string
  icon: React.ElementType
  to: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard',     icon: LayoutDashboard, to: '/' },
  { label: 'Agentes',       icon: Users,           to: '/agentes' },
  { label: 'Conversas',     icon: MessageSquare,   to: '/conversas' },
  { label: 'Contatos',      icon: Contact,         to: '/contatos' },
  { label: 'Analytics',     icon: BarChart3,       to: '/analytics' },
  { label: 'Configurações', icon: Settings,        to: '/configuracoes' },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-[#1f1f23] border-r border-zinc-700/50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-700/50">
        <img src={logoTrivoxia} alt="TrivoxIA" className="h-8 w-8 object-contain shrink-0" />
        <span className="text-base font-semibold text-white tracking-tight">TrivoxIA</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
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
            <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 mt-0.5">
              Pro
            </span>
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
