import { cn } from '@/lib/utils'

export type AgentStatus = 'active' | 'inactive' | 'maintenance'

const CFG: Record<AgentStatus, { label: string; cls: string; dot: string }> = {
  active:      { label: 'Ativo',       cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  inactive:    { label: 'Inativo',     cls: 'bg-slate-500/15   text-slate-400   border-slate-500/20',   dot: 'bg-slate-400'   },
  maintenance: { label: 'Manutenção',  cls: 'bg-amber-500/15   text-amber-400   border-amber-500/20',   dot: 'bg-amber-400'   },
}

interface Props {
  status: AgentStatus
  size?: 'sm' | 'md'
}

export default function AgentStatusBadge({ status, size = 'md' }: Props) {
  const { label, cls, dot } = CFG[status] ?? CFG.inactive
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border font-medium',
      size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5',
      cls
    )}>
      <span className={cn('rounded-full shrink-0', size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2', dot)} />
      {label}
    </span>
  )
}
