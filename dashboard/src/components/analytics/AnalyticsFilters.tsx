import { useState } from 'react'
import { Filter, Calendar } from 'lucide-react'
import type { AnalyticsPeriod, AnalyticsFilters } from '@/lib/api'

const PERIODS: { label: string; value: AnalyticsPeriod }[] = [
  { label: 'Hoje',       value: 'today' },
  { label: '7 dias',     value: '7d' },
  { label: '30 dias',    value: '30d' },
  { label: '90 dias',    value: '90d' },
  { label: 'Personalizado', value: 'custom' },
]

const DEPARTMENTS = ['Suporte Técnico', 'Vendas', 'Financeiro', 'RH', 'Outros']

interface Props {
  filters: AnalyticsFilters
  onChange: (f: AnalyticsFilters) => void
}

export default function AnalyticsFiltersBar({ filters, onChange }: Props) {
  const [showDepts, setShowDepts] = useState(false)

  function setPeriod(period: AnalyticsPeriod) {
    onChange({ ...filters, period })
  }

  function toggleDept(dept: string) {
    const cur = filters.departments ?? []
    const next = cur.includes(dept) ? cur.filter(d => d !== dept) : [...cur, dept]
    onChange({ ...filters, departments: next })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Period selector */}
      <div className="flex items-center gap-1 bg-[var(--bg-page)]/50 border border-[var(--border-default)] rounded-lg p-1">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filters.period === p.value
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {filters.period === 'custom' && (
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          <input
            type="date"
            value={filters.startDate ?? ''}
            onChange={e => onChange({ ...filters, startDate: e.target.value })}
            className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50"
          />
          <span className="text-[var(--text-tertiary)] text-xs">até</span>
          <input
            type="date"
            value={filters.endDate ?? ''}
            onChange={e => onChange({ ...filters, endDate: e.target.value })}
            className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      )}

      {/* Department filter */}
      <div className="relative">
        <button
          onClick={() => setShowDepts(v => !v)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            (filters.departments?.length ?? 0) > 0
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-[var(--bg-page)]/50 border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Filter className="h-3 w-3" />
          Departamentos
          {(filters.departments?.length ?? 0) > 0 && (
            <span className="bg-emerald-500/30 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-full">
              {filters.departments!.length}
            </span>
          )}
        </button>

        {showDepts && (
          <div className="absolute top-full left-0 mt-1 z-20 bg-[var(--bg-card)] border border-[var(--border-medium)] rounded-xl p-2 min-w-[180px] shadow-xl">
            {DEPARTMENTS.map(dept => {
              const selected = (filters.departments ?? []).includes(dept)
              return (
                <button
                  key={dept}
                  onClick={() => toggleDept(dept)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                    selected ? 'bg-emerald-500/15 text-emerald-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-zinc)]/30'
                  }`}
                >
                  {dept}
                </button>
              )
            })}
            {(filters.departments?.length ?? 0) > 0 && (
              <button
                onClick={() => { onChange({ ...filters, departments: [] }); setShowDepts(false) }}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 mt-1 border-t border-[var(--border-default)]"
              >
                Limpar filtro
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
