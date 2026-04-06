import { formatRelativeTime, cn } from '@/lib/utils'
import { MessageSquare } from 'lucide-react'
import type { ConversationListItem } from '@/lib/api'

interface Props {
  data: ConversationListItem[]
  loading: boolean
  onView: (telefone: string) => void
}

const STATUS_STYLES: Record<string, string> = {
  'em atendimento': 'bg-blue-500/20   text-blue-400   border-blue-500/30',
  'agendado':       'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'transferido':    'bg-amber-500/20  text-amber-400  border-amber-500/30',
  'cancelado':      'bg-red-500/20    text-red-400    border-red-500/30',
  'novo':           'bg-cyan-500/20   text-[var(--sidebar-active-text)]   border-cyan-500/30',
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status?.toLowerCase()] ?? 'bg-zinc-500/20 text-[var(--text-secondary)] border-zinc-500/30'
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', cls)}>
      {status || '—'}
    </span>
  )
}

const SKELETON = Array.from({ length: 10 })

export default function ConversationsTable({ data, loading, onView }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-zinc)]">
            <th className="text-left text-xs font-medium text-[var(--text-secondary)] px-5 py-3">Contato</th>
            <th className="text-left text-xs font-medium text-[var(--text-secondary)] px-5 py-3">Telefone</th>
            <th className="text-left text-xs font-medium text-[var(--text-secondary)] px-5 py-3">Status</th>
            <th className="text-left text-xs font-medium text-[var(--text-secondary)] px-5 py-3">Última atividade</th>
            <th className="text-left text-xs font-medium text-[var(--text-secondary)] px-5 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? SKELETON.map((_, i) => (
                <tr key={i} className="border-b border-[var(--border-zinc)]/30">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-5 py-3.5">
                      <div className="h-3.5 rounded bg-[var(--border-zinc)]/30 animate-pulse" style={{ width: j === 2 ? 72 : 100 }} />
                    </td>
                  ))}
                </tr>
              ))
            : data.length === 0
              ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[var(--text-tertiary)] text-sm">
                    Nenhuma conversa encontrada.
                  </td>
                </tr>
              )
              : data.map(conv => (
                  <tr
                    key={conv.telefone}
                    className="border-b border-[var(--border-zinc)]/30 hover:bg-[var(--sidebar-hover-bg)] transition-colors cursor-pointer group"
                    onClick={() => onView(conv.telefone)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-[var(--border-zinc)]/40 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase">
                            {(conv.nome || '?')[0]}
                          </span>
                        </div>
                        <span className="font-medium text-[var(--text-primary)] group-hover:text-[var(--sidebar-active-text)] transition-colors truncate max-w-[130px]">
                          {conv.nome || 'Desconhecido'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-secondary)] text-xs font-mono whitespace-nowrap">
                      {conv.telefone}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={conv.status} />
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-tertiary)] text-xs whitespace-nowrap">
                      {conv.ultima_mensagem ? formatRelativeTime(conv.ultima_mensagem) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <MessageSquare className="h-3.5 w-3.5 text-[var(--text-tertiary)] group-hover:text-[var(--sidebar-active-text)] transition-colors" />
                    </td>
                  </tr>
                ))}
        </tbody>
      </table>
    </div>
  )
}
