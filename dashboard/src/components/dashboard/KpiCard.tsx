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
        'rounded-2xl bg-[#27272a] ring-1 ring-white/10 p-5 space-y-3 hover:ring-white/20 transition-all',
        href && 'cursor-pointer'
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-400">{title}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-700/60">
          <Icon className="h-4 w-4 text-zinc-400" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-7 w-24 bg-zinc-700/60 rounded-xl animate-pulse" />
          <div className="h-4 w-32 bg-zinc-700/40 rounded animate-pulse" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
          <div className="flex items-center gap-2">
            {change !== undefined && (
              <span
                className={cn(
                  'flex items-center gap-1 text-xs font-semibold',
                  isPositive ? 'text-green-400' : 'text-red-400'
                )}
              >
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatPercent(Math.abs(change))}
              </span>
            )}
            {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
          </div>
        </>
      )}
    </div>
  )
}
