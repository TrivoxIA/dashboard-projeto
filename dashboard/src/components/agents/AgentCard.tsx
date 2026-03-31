import AgentStatusBadge, { type AgentStatus } from './AgentStatusBadge'
import { CheckCircle2, MessageSquare, Clock } from 'lucide-react'

const DEPT_COLOR: Record<string, string> = {
  'Suporte Técnico': '#10b981',
  'Vendas':          '#3b82f6',
  'Financeiro':      '#f59e0b',
  'RH':              '#8b5cf6',
  'Outros':          '#ef4444',
}

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
}

export default function AgentCard({ agent, onClick }: Props) {
  const color = DEPT_COLOR[agent.department] ?? '#64748b'

  return (
    <button
      onClick={() => onClick(agent.id)}
      className="w-full text-left bg-[#27272a] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.14] hover:bg-[#2d2d30] transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white shrink-0"
            style={{ backgroundColor: color + '22', border: `1px solid ${color}33` }}
          >
            <span style={{ color }}>{agent.name[0].toUpperCase()}</span>
          </div>
          <div>
            <p className="font-semibold text-white text-sm group-hover:text-emerald-400 transition-colors">
              {agent.name}
            </p>
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: color + '18', color }}
            >
              {agent.department}
            </span>
          </div>
        </div>
        <AgentStatusBadge status={agent.status} size="sm" />
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: MessageSquare, value: agent.total,                                                label: 'Total' },
          { icon: CheckCircle2,  value: `${agent.resolutionRate}%`,                                 label: 'Resolução' },
          { icon: Clock,         value: agent.avgResponseTime > 0 ? `${agent.avgResponseTime}s` : '—', label: 'Tempo' },
        ].map(({ icon: Icon, value, label }) => (
          <div key={label} className="bg-white/[0.03] rounded-lg px-2 py-2 text-center">
            <Icon className="h-3 w-3 text-slate-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-white leading-none">{value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </button>
  )
}

// Skeleton
export function AgentCardSkeleton() {
  return (
    <div className="bg-[#27272a] border border-white/[0.06] rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-white/[0.06] animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-3.5 w-28 rounded bg-white/[0.06] animate-pulse" />
          <div className="h-3 w-20 rounded bg-white/[0.04] animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1,2,3].map(i => <div key={i} className="h-14 rounded-lg bg-white/[0.04] animate-pulse" />)}
      </div>
    </div>
  )
}
