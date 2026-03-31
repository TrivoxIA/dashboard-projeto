import type { FlowStatus } from '@/lib/api'

interface Props {
  status: FlowStatus
  size?: 'sm' | 'md'
}

const CONFIG: Record<FlowStatus, { label: string; classes: string; dot?: string }> = {
  active:   { label: 'Ativo',    classes: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', dot: 'bg-emerald-400' },
  inactive: { label: 'Inativo',  classes: 'text-slate-400  bg-slate-500/15   border-slate-500/30' },
  error:    { label: 'Erro',     classes: 'text-red-400    bg-red-500/15     border-red-500/30',    dot: 'bg-red-400 animate-pulse' },
}

export default function FlowStatusBadge({ status, size = 'md' }: Props) {
  const { label, classes, dot } = CONFIG[status] ?? CONFIG.inactive
  const sz = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sz} ${classes}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      {label}
    </span>
  )
}
