import SearchBar from '@/components/shared/SearchBar'
import { Filter } from 'lucide-react'

export interface ConvFilters {
  search: string
  status: string
  department: string
  dateFrom: string
  dateTo: string
}

interface Props {
  filters: ConvFilters
  onChange: (f: Partial<ConvFilters>) => void
  agents: { id: string; name: string }[]
}

const DEPARTMENTS = ['Suporte Técnico', 'Vendas', 'Financeiro', 'RH', 'Outros']

export default function ConversationFilters({ filters, onChange, agents: _agents }: Props) {
  const sel = 'bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-emerald-500/50 transition-colors cursor-pointer'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-48">
        <SearchBar value={filters.search} onChange={v => onChange({ search: v })} placeholder="Buscar por contato ou agente..." />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        <select value={filters.status} onChange={e => onChange({ status: e.target.value })} className={sel}>
          <option value="">Todos os status</option>
          <option value="open">Aberto</option>
          <option value="pending">Pendente</option>
          <option value="resolved">Resolvido</option>
        </select>
        <select value={filters.department} onChange={e => onChange({ department: e.target.value })} className={sel}>
          <option value="">Todos os departs.</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={e => onChange({ dateFrom: e.target.value })}
          className={sel + ' text-slate-400'}
          title="Data inicial"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={e => onChange({ dateTo: e.target.value })}
          className={sel + ' text-slate-400'}
          title="Data final"
        />
      </div>
    </div>
  )
}
