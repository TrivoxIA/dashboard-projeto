import { MessageSquare, CheckCircle2, Clock, TrendingUp, BarChart2, Star } from 'lucide-react'
import type { AnalyticsSummary } from '@/lib/api'

function formatTime(s: number) {
  if (s <= 0) return '—'
  const sec = Math.round(s)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  const rem = sec % 60
  return `${min}min ${rem}s`
}

function formatDate(d: string) {
  if (!d || d === '—') return '—'
  try {
    const date = new Date(d.includes('T') ? d : d + 'T12:00:00')
    if (isNaN(date.getTime())) return d
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  } catch { return d }
}

interface CardProps {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  color?: string
}

function MetricCard({ icon: Icon, label, value, sub, color = '#10b981' }: CardProps) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-secondary)] font-medium">{label}</p>
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: color + '20', border: `1px solid ${color}30` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
      </div>
      <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
      {sub && <p className="text-[11px] text-[var(--text-tertiary)]">{sub}</p>}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-[var(--border-zinc)]/40 rounded animate-pulse" />
        <div className="h-7 w-7 rounded-lg bg-[var(--border-zinc)]/40 animate-pulse" />
      </div>
      <div className="h-6 w-20 bg-[var(--border-zinc)]/40 rounded animate-pulse" />
      <div className="h-3 w-32 bg-[var(--bg-page)]/50 rounded animate-pulse" />
    </div>
  )
}

interface Props {
  data: AnalyticsSummary | null
  loading: boolean
}

export default function AnalyticsMetrics({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (!data) return null

  const cards: CardProps[] = [
    {
      icon: MessageSquare,
      label: 'Total de Conversas',
      value: String(data.total_conversations),
      sub: 'no período selecionado',
      color: '#3b82f6',
    },
    {
      icon: CheckCircle2,
      label: 'Taxa de Resolução',
      value: `${data.resolution_rate}%`,
      sub: `${data.resolved_count} agendadas`,
      color: '#10b981',
    },
    {
      icon: Clock,
      label: 'Tempo Médio',
      value: formatTime(data.avg_response_time),
      sub: 'de resposta',
      color: '#f59e0b',
    },
    {
      icon: TrendingUp,
      label: 'Média por Dia',
      value: String(data.avg_per_day),
      sub: 'conversas/dia',
      color: '#8b5cf6',
    },
    {
      icon: Star,
      label: 'Dia de Pico',
      value: formatDate(data.peak_day),
      sub: 'dia com mais conversas',
      color: '#ef4444',
    },
    {
      icon: BarChart2,
      label: 'Agendadas',
      value: String(data.resolved_count),
      sub: 'conversas agendadas',
      color: '#10b981',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map(c => <MetricCard key={c.label} {...c} />)}
    </div>
  )
}
