import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

const PAGE_TITLES: Record<string, string> = {
  '/':             'Dashboard',
  '/agentes':      'Agentes',
  '/conversas':    'Conversas',
  '/contatos':     'Contatos',
  '/fluxos':       'Fluxos',
  '/analytics':    'Analytics',
  '/configuracoes':'Configurações',
}

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'Dashboard'

  return (
    <div className="flex min-h-screen bg-[#18181b]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header — V0 style */}
        <header className="flex h-14 items-center gap-3 border-b border-zinc-700/50 bg-[#18181b] px-6 shrink-0">
          <div className="w-px h-5 bg-zinc-700/70" />
          <span className="text-sm font-medium text-zinc-400">{title}</span>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
