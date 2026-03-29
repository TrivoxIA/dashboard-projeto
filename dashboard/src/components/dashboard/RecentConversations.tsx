import { cn, formatRelativeTime } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { RecentConversation } from '@/lib/api'

interface Props {
  data: RecentConversation[]
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  loading?: boolean
}

const STATUS_CONFIG = {
  resolved: { label: 'Resolvido', classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  pending:  { label: 'Pendente',  classes: 'bg-amber-500/15  text-amber-400  border-amber-500/20'  },
  open:     { label: 'Aberto',    classes: 'bg-blue-500/15   text-blue-400   border-blue-500/20'   },
} as const

function StatusBadge({ status }: { status: RecentConversation['status'] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.open
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', cfg.classes)}>
      {cfg.label}
    </span>
  )
}

const SKELETON_ROWS = Array.from({ length: 5 })

export default function RecentConversations({ data, total, page, pageSize, onPageChange, loading }: Props) {
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="bg-[#13131f] border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
        <div>
          <h3 className="text-sm font-semibold text-white">Conversas Recentes</h3>
          <p className="text-xs text-slate-500 mt-0.5">{total} conversas no total</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {['Contato', 'Agente', 'Status', 'Departamento', 'Início'].map((col) => (
                <th
                  key={col}
                  className="text-left text-xs font-medium text-slate-500 px-5 py-3 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? SKELETON_ROWS.map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.03]">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-3.5 rounded bg-white/[0.05] animate-pulse" style={{ width: j === 2 ? 72 : j === 3 ? 96 : 120 }} />
                      </td>
                    ))}
                  </tr>
                ))
              : data.map((conv) => (
                  <tr
                    key={conv.id}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-slate-400 uppercase">
                            {conv.contact_name[0]}
                          </span>
                        </div>
                        <span className="font-medium text-white truncate max-w-[140px]">{conv.contact_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">{conv.agent_name}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={conv.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">{conv.department}</td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {formatRelativeTime(conv.started_at)}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.05]">
          <p className="text-xs text-slate-500">
            Página {page} de {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                    p === page
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                  )}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
