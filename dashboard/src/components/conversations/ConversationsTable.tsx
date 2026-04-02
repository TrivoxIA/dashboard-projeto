import { formatRelativeTime, cn } from '@/lib/utils'
import { MessageSquare } from 'lucide-react'

export interface ConversationRow {
  telefone: string
  nome: string
  status: string
  ultima_mensagem: string | null
  followup: boolean | null
  respondeu_FU: boolean | null
}

interface Props {
  data: ConversationRow[]
  loading: boolean
  onView: (telefone: string) => void
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ativo:       'bg-cyan-500/20   text-cyan-400   border-cyan-500/30',
    inativo:     'bg-zinc-500/20   text-zinc-400   border-zinc-500/30',
    transferido: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    encerrado:   'bg-slate-500/20  text-slate-400  border-slate-500/30',
    open:        'bg-cyan-500/20   text-cyan-400   border-cyan-500/30',
    resolved:    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    pending:     'bg-amber-500/20  text-amber-400  border-amber-500/30',
    bot:         'bg-sky-500/20    text-sky-400    border-sky-500/30',
  }
  const cls = map[status?.toLowerCase()] ?? 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
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
          <tr className="border-b border-zinc-700/50">
            <th className="text-left text-xs font-medium text-zinc-400 px-5 py-3">Contato</th>
            <th className="text-left text-xs font-medium text-zinc-400 px-5 py-3">Telefone</th>
            <th className="text-left text-xs font-medium text-zinc-400 px-5 py-3">Status</th>
            <th className="text-left text-xs font-medium text-zinc-400 px-5 py-3 hidden md:table-cell">Follow-up</th>
            <th className="text-left text-xs font-medium text-zinc-400 px-5 py-3">Última mensagem</th>
            <th className="text-left text-xs font-medium text-zinc-400 px-5 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? SKELETON.map((_, i) => (
                <tr key={i} className="border-b border-zinc-700/30">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-3.5">
                      <div className="h-3.5 rounded bg-white/[0.05] animate-pulse" style={{ width: j === 2 ? 72 : 100 }} />
                    </td>
                  ))}
                </tr>
              ))
            : data.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500 text-sm">
                    Nenhuma conversa encontrada.
                  </td>
                </tr>
              )
              : data.map(conv => (
                  <tr
                    key={conv.telefone}
                    className="border-b border-zinc-700/30 hover:bg-zinc-700/10 transition-colors cursor-pointer group"
                    onClick={() => onView(conv.telefone)}
                  >
                    {/* Contato */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-slate-400 uppercase">
                            {(conv.nome || '?')[0]}
                          </span>
                        </div>
                        <span className="font-medium text-white group-hover:text-cyan-400 transition-colors truncate max-w-[130px]">
                          {conv.nome || 'Desconhecido'}
                        </span>
                      </div>
                    </td>

                    {/* Telefone */}
                    <td className="px-5 py-3.5 text-slate-400 text-xs font-mono whitespace-nowrap">
                      {conv.telefone}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={conv.status} />
                    </td>

                    {/* Follow-up */}
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {conv.followup ? (
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs border',
                          conv.respondeu_FU
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                        )}>
                          {conv.respondeu_FU ? 'Respondeu' : 'Aguardando'}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </td>

                    {/* Última mensagem */}
                    <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                      {conv.ultima_mensagem ? formatRelativeTime(conv.ultima_mensagem) : '—'}
                    </td>

                    {/* Ícone de abrir chat */}
                    <td className="px-5 py-3.5">
                      <MessageSquare className="h-3.5 w-3.5 text-zinc-600 group-hover:text-cyan-400 transition-colors" />
                    </td>
                  </tr>
                ))}
        </tbody>
      </table>
    </div>
  )
}
