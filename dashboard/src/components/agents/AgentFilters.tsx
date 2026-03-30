import SearchBar from '@/components/shared/SearchBar'
import type { AgentStatus } from './AgentStatusBadge'

export interface AgentFilterState {
  search: string
  status: AgentStatus | ''
  department: string
}

const DEPARTMENTS = ['Suporte Técnico', 'Vendas', 'Financeiro', 'RH', 'Outros']
const STATUSES: { value: AgentStatus | ''; label: string }[] = [
  { value: '',            label: 'Todos os status' },
  { value: 'active',      label: 'Ativo' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'inactive',    label: 'Inativo' },
]

interface Props {
  filters: AgentFilterState
  onChange: (f: Partial<AgentFilterState>) => void
}

export default function AgentFilters({ filters, onChange }: Props) {
  const sel = 'bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-emerald-500/50 transition-colors cursor-pointer'
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex-1 min-w-48">
        <SearchBar value={filters.search} onChange={v => onChange({ search: v })} placeholder="Buscar agente por nome..." />
      </div>
      <select value={filters.status} onChange={e => onChange({ status: e.target.value as AgentStatus | '' })} className={sel}>
        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <select value={filters.department} onChange={e => onChange({ department: e.target.value })} className={sel}>
        <option value="">Todos os departs.</option>
        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
    </div>
  )
}
