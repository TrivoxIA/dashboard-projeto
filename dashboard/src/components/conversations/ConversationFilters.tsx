import { useEffect, useState } from 'react'
import SearchBar from '@/components/shared/SearchBar'
import { Filter } from 'lucide-react'
import { api } from '@/lib/api'

export interface ConvFilters {
  search: string
  status: string
  dateFrom: string
  dateTo: string
  // mantidos por compatibilidade mas não usados no SDR
  department: string
}

interface Props {
  filters: ConvFilters
  onChange: (f: Partial<ConvFilters>) => void
  agents?: { id: string; name: string }[]
}

export default function ConversationFilters({ filters, onChange }: Props) {
  const [statuses, setStatuses] = useState<string[]>([])

  useEffect(() => {
    api.getSdrDistinctStatuses().then(setStatuses).catch(() => {})
  }, [])

  const sel = 'bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-cyan-500/50 transition-colors cursor-pointer'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-48">
        <SearchBar value={filters.search} onChange={v => onChange({ search: v })} placeholder="Buscar por nome ou telefone..." />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        <select value={filters.status} onChange={e => onChange({ status: e.target.value })} className={sel}>
          <option value="">Todos os status</option>
          {statuses.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
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
