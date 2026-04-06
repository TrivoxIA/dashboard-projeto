import { Bot } from 'lucide-react'
import type { AgentStatus } from './AgentStatusBadge'

export interface AgentCardData {
  id: string
  name: string
  department: string
  status: AgentStatus
  total: number
  resolved: number
  resolutionRate: number
  avgResponseTime: number
}

interface Props {
  agent: AgentCardData
  onClick: (id: string) => void
  onToggle?: (id: string, next: AgentStatus) => void
}

// Simple toggle switch styled like V0 (data-[state=checked]:bg-primary)
function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => { e.stopPropagation(); onChange() }}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none ${
        checked ? 'bg-cyan-500' : 'bg-[var(--border-zinc)]'
      }`}
    >
      <span
        className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export default function AgentCard({ agent, onClick, onToggle }: Props) {
  const isActive = agent.status === 'active'

  return (
    <div
      className="bg-[var(--bg-card)] border border-[var(--border-zinc)] rounded-xl hover:border-cyan-500/30 transition-all cursor-pointer"
      onClick={() => onClick(agent.id)}
    >
      {/* Header: Avatar + Switch */}
      <div className="flex flex-row items-start justify-between p-5 pb-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/40 flex items-center justify-center">
          <Bot className="h-5 w-5 text-[var(--sidebar-active-text)]" />
        </div>
        <Switch
          checked={isActive}
          onChange={() => onToggle?.(agent.id, isActive ? 'inactive' : 'active')}
        />
      </div>

      {/* Name + Department */}
      <div className="px-5 pb-3">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">{agent.name}</h3>
        <p className="text-sm text-[var(--text-secondary)]">{agent.department}</p>
      </div>

      {/* Stats grid */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-[var(--bg-page)]/60 p-2">
            <p className="text-lg font-semibold text-[var(--text-primary)]">{agent.total}</p>
            <p className="text-xs text-[var(--text-tertiary)]">Total</p>
          </div>
          <div className="rounded-lg bg-[var(--bg-page)]/60 p-2">
            <p className="text-lg font-semibold text-[var(--text-primary)]">{agent.resolved}</p>
            <p className="text-xs text-[var(--text-tertiary)]">Resolvidas</p>
          </div>
          <div className="rounded-lg bg-[var(--bg-page)]/60 p-2">
            <p className="text-lg font-semibold text-[var(--text-primary)]">{agent.resolutionRate}%</p>
            <p className="text-xs text-[var(--text-tertiary)]">Taxa</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onClick(agent.id) }}
            className="flex-1 text-sm font-medium text-[var(--text-primary)] bg-transparent border border-[var(--border-zinc)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--text-primary)] rounded-lg py-1.5 transition-colors"
          >
            Configurar
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClick(agent.id) }}
            className="flex-1 text-sm font-medium text-[var(--text-primary)] bg-transparent border border-[var(--border-zinc)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--text-primary)] rounded-lg py-1.5 transition-colors"
          >
            Ver Logs
          </button>
        </div>
      </div>
    </div>
  )
}

// Skeleton
export function AgentCardSkeleton() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-zinc)] rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-xl bg-[var(--border-zinc)]/50 animate-pulse" />
        <div className="h-5 w-9 rounded-full bg-[var(--border-zinc)]/50 animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-32 rounded bg-[var(--border-zinc)]/50 animate-pulse" />
        <div className="h-3 w-20 rounded bg-[var(--sidebar-hover-bg)] animate-pulse" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-lg bg-[var(--sidebar-hover-bg)] animate-pulse" />)}
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-8 rounded-lg bg-[var(--sidebar-hover-bg)] animate-pulse" />
        <div className="flex-1 h-8 rounded-lg bg-[var(--sidebar-hover-bg)] animate-pulse" />
      </div>
    </div>
  )
}
