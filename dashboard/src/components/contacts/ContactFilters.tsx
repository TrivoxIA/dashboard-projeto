import SearchBar from '@/components/shared/SearchBar'
import { ArrowUpDown } from 'lucide-react'

export type ContactSort = 'name' | 'created_at' | 'conversations_count'

interface Props {
  search: string
  onSearch: (v: string) => void
  sort: ContactSort
  onSort: (v: ContactSort) => void
}

export default function ContactFilters({ search, onSearch, sort, onSort }: Props) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex-1 min-w-48">
        <SearchBar value={search} onChange={onSearch} placeholder="Buscar por nome, e-mail ou empresa..." />
      </div>
      <div className="flex items-center gap-2">
        <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
        <select
          value={sort}
          onChange={e => onSort(e.target.value as ContactSort)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
        >
          <option value="name">Nome (A-Z)</option>
          <option value="created_at">Mais recente</option>
          <option value="conversations_count">Mais conversas</option>
        </select>
      </div>
    </div>
  )
}
