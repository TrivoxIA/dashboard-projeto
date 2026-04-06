import { Search } from 'lucide-react'
import type { FlowStatus, FlowType } from '@/lib/api'

export interface FlowFilterState {
  search: string
  status: FlowStatus | 'all'
  type: FlowType | 'all'
}

const STATUS_OPTIONS: { value: FlowFilterState['status']; label: string }[] = [
  { value: 'all',      label: 'Todos' },
  { value: 'active',   label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
  { value: 'error',    label: 'Com erro' },
]

const TYPE_OPTIONS: { value: FlowFilterState['type']; label: string }[] = [
  { value: 'all',       label: 'Todos os tipos' },
  { value: 'webhook',   label: 'Webhook' },
  { value: 'scheduled', label: 'Agendado' },
  { value: 'manual',    label: 'Manual' },
]

interface Props {
  filters: FlowFilterState
  onChange: (f: FlowFilterState) => void
}

export default function FlowFilters({ filters, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
        <input
          type="text"
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          placeholder="Buscar fluxo..."
          className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-emerald-500/40 w-52"
        />
      </div>

      {/* Status */}
      <div className="flex items-center gap-1 bg-[var(--bg-page)]/50 border border-[var(--border-default)] rounded-lg p-1">
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange({ ...filters, status: opt.value })}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filters.status === opt.value
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Type */}
      <select
        value={filters.type}
        onChange={e => onChange({ ...filters, type: e.target.value as FlowFilterState['type'] })}
        className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-xs text-[var(--text-secondary)] focus:outline-none focus:border-emerald-500/40"
      >
        {TYPE_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
