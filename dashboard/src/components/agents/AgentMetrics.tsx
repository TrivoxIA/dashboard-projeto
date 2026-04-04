import { MessageSquare, CheckCircle2, Clock, CircleDot } from 'lucide-react'

export interface AgentStats {
  total: number
  resolved: number
  open: number
  resolutionRate: number
  avgResponseTime: number
}

function formatTime(seg: number) {
  if (seg <= 0) return '—'
  const s = Math.round(seg)
  if (s < 60) return `${s}s`
  const min = Math.floor(s / 60)
  const rem = s % 60
  return `${min}min ${rem}s`
}

interface Props { stats: AgentStats; loading?: boolean }

export default function AgentMetrics({ stats, loading }: Props) {
  const items = [
    { icon: MessageSquare, label: 'Total',          value: stats.total,                               color: 'text-slate-400 bg-white/[0.06]' },
    { icon: CheckCircle2,  label: 'Resolvidas',     value: stats.resolved,                            color: 'text-emerald-400 bg-emerald-500/15' },
    { icon: CircleDot,     label: 'Abertas',        value: stats.open,                                color: 'text-blue-400 bg-blue-500/15' },
    { icon: CheckCircle2,  label: 'Taxa resolução', value: `${stats.resolutionRate}%`,                color: 'text-purple-400 bg-purple-500/15' },
    { icon: Clock,         label: 'Tempo médio',    value: formatTime(stats.avgResponseTime),         color: 'text-amber-400 bg-amber-500/15' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {items.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
          {loading ? (
            <div className="space-y-2">
              <div className="h-3 w-12 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-5 w-8 bg-white/[0.04] rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className={`inline-flex h-7 w-7 items-center justify-center rounded-lg mb-2 ${color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <p className="text-lg font-bold text-white leading-none">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
