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

// Mapeamento de status SDR → visual
const STATUS_KNOWN: Record<string, { label: string; classes: string }> = {
  resolved:    { label: 'Resolvido',    classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  pending:     { label: 'Pendente',     classes: 'bg-amber-500/15  text-amber-400  border-amber-500/20'  },
  open:        { label: 'Aberto',       classes: 'bg-blue-500/15   text-blue-400   border-blue-500/20'   },
  ativo:       { label: 'Ativo',        classes: 'bg-cyan-500/15   text-[var(--sidebar-active-text)]   border-cyan-500/20'   },
  inativo:     { label: 'Inativo',      classes: 'bg-zinc-500/15   text-[var(--text-secondary)]   border-zinc-500/20'   },
  transferido: { label: 'Transferido',  classes: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  encerrado:   { label: 'Encerrado',    classes: 'bg-slate-500/15  text-[var(--text-secondary)]  border-slate-500/20'  },
  bot:         { label: 'Bot',          classes: 'bg-sky-500/15    text-sky-400    border-sky-500/20'    },
}

const STATUS_DEFAULT = { label: '', classes: 'bg-zinc-500/15 text-[var(--text-secondary)] border-zinc-500/20' }

function StatusBadge({ status }: { status: string }) {
  const cfg    = STATUS_KNOWN[status?.toLowerCase()] ?? STATUS_DEFAULT
  const label  = cfg.label || status || '—'
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', cfg.classes)}>
      {label}
    </span>
  )
}

const SKELETON_ROWS = Array.from({ length: 5 })

export default function RecentConversations({ data, total, page, pageSize, onPageChange, loading }: Props) {
  const totalPages = Math.ceil(total / pageSize)
  // Detecta se é modo SDR (tem campo telefone)
  const isSdr = data.length > 0 && !!data[0].telefone

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Conversas Recentes</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{total} conversas no total</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              {(isSdr
                ? ['Contato', 'Telefone', 'Status', 'Última mensagem']
                : ['Contato', 'Agente', 'Status', 'Departamento', 'Início']
              ).map(col => (
                <th
                  key={col}
                  className="text-left text-xs font-medium text-[var(--text-tertiary)] px-5 py-3 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? SKELETON_ROWS.map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border-default)]">
                    {Array.from({ length: isSdr ? 4 : 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-3.5 rounded bg-[var(--border-zinc)]/30 animate-pulse" style={{ width: j === 2 ? 72 : 120 }} />
                      </td>
                    ))}
                  </tr>
                ))
              : data.map((conv) => (
                  <tr
                    key={conv.id}
                    className="border-b border-[var(--border-default)] hover:bg-[var(--bg-page)]/30 transition-colors"
                  >
                    {/* Contato */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-[var(--border-zinc)]/40 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase">
                            {conv.contact_name[0]}
                          </span>
                        </div>
                        <span className="font-medium text-[var(--text-primary)] truncate max-w-[140px]">{conv.contact_name}</span>
                      </div>
                    </td>

                    {isSdr ? (
                      // Colunas SDR
                      <>
                        <td className="px-5 py-3.5 text-[var(--text-secondary)] whitespace-nowrap text-xs font-mono">
                          {conv.telefone}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={conv.status} />
                        </td>
                        <td className="px-5 py-3.5 text-[var(--text-tertiary)] whitespace-nowrap text-xs">
                          {formatRelativeTime(conv.started_at)}
                        </td>
                      </>
                    ) : (
                      // Colunas CRM
                      <>
                        <td className="px-5 py-3.5 text-[var(--text-secondary)] whitespace-nowrap">{conv.agent_name}</td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={conv.status} />
                        </td>
                        <td className="px-5 py-3.5 text-[var(--text-secondary)] whitespace-nowrap">{conv.department}</td>
                        <td className="px-5 py-3.5 text-[var(--text-tertiary)] whitespace-nowrap text-xs">
                          {formatRelativeTime(conv.started_at)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-default)]">
          <p className="text-xs text-[var(--text-tertiary)]">
            Página {page} de {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-zinc)]/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                      ? 'bg-cyan-500/20 text-[var(--sidebar-active-text)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-zinc)]/40'
                  )}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-zinc)]/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
