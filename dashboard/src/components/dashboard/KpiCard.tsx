import { cn, formatPercent } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface KpiCardProps {
  title: string
  value: string
  change?: number
  subtitle?: string
  icon: LucideIcon
  loading?: boolean
  href?: string
}

export default function KpiCard({ title, value, change, subtitle, icon: Icon, loading, href }: KpiCardProps) {
  const isPositive = (change ?? 0) >= 0
  const navigate = useNavigate()

  return (
    <div
      onClick={() => href && navigate(href)}
      className={cn(
        'bg-[#13131f] border border-white/[0.06] rounded-xl p-5 space-y-3 hover:border-white/[0.10] transition-colors',
        href && 'cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-400 font-medium">{title}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06]">
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-7 w-24 bg-white/[0.06] rounded animate-pulse" />
          <div className="h-4 w-32 bg-white/[0.04] rounded animate-pulse" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
          <div className="flex items-center gap-2">
            {change !== undefined && (
              <span
                className={cn(
                  'flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded',
                  isPositive
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-red-400 bg-red-500/10'
                )}
              >
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatPercent(Math.abs(change))}
              </span>
            )}
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </>
      )}
    </div>
  )
}
