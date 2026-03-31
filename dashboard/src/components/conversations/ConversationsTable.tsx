import { useNavigate } from 'react-router-dom'
import { formatRelativeTime, cn } from '@/lib/utils'
import { Eye } from 'lucide-react'

export interface ConversationRow {
  id: string
  status: 'open' | 'pending' | 'resolved'
  department: string
  started_at: string
  ended_at: string | null
  contact_name: string
  agent_name: string
}

interface Props {
  data: ConversationRow[]
  loading: boolean
  onView: (id: string) => void
}

const STATUS_CFG = {
  resolved: { label: 'Resolvido', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  pending:  { label: 'Pendente',  cls: 'bg-amber-500/20  text-amber-400  border-amber-500/30'  },
  open:     { label: 'Aberto',    cls: 'bg-cyan-500/20   text-cyan-400   border-cyan-500/30'   },
}

function duration(started: string, ended: string | null): string {
  if (!ended) return '—'
  const s = (new Date(ended).getTime() - new Date(started).getTime()) / 1000
  if (s < 60) return `${Math.round(s)}s`
  if (s < 3600) return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
}

const SKELETON = Array.from({ length: 10 })

export default function ConversationsTable({ data, loading, onView }: Props) {
  const navigate = useNavigate()

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-700/50 hover:bg-transparent">
            {['Contato', 'Agente', 'Status', 'Departamento', 'Início', 'Duração', ''].map(col => (
              <th key={col} className="text-left text-xs font-medium text-zinc-400 px-5 py-3 whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? SKELETON.map((_, i) => (
                <tr key={i} className="border-b border-zinc-700/30">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-5 py-3.5">
                      <div className="h-3.5 rounded bg-white/[0.05] animate-pulse" style={{ width: j === 2 ? 72 : 100 }} />
                    </td>
                  ))}
                </tr>
              ))
            : data.length === 0
              ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500 text-sm">
                    Nenhuma conversa encontrada.
                  </td>
                </tr>
              )
              : data.map(conv => {
                  const cfg = STATUS_CFG[conv.status] ?? STATUS_CFG.open
                  return (
                    <tr
                      key={conv.id}
                      className="border-b border-zinc-700/30 hover:bg-zinc-700/10 transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => navigate(`/contatos`)}
                          className="flex items-center gap-2.5 text-left"
                        >
                          <div className="h-7 w-7 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-slate-400 uppercase">{conv.contact_name[0]}</span>
                          </div>
                          <span className="font-medium text-white hover:text-cyan-400 transition-colors truncate max-w-[130px]">
                            {conv.contact_name}
                          </span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">{conv.agent_name}</td>
                      <td className="px-5 py-3.5">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', cfg.cls)}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">{conv.department}</td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap text-xs">{formatRelativeTime(conv.started_at)}</td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap text-xs">{duration(conv.started_at, conv.ended_at)}</td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => onView(conv.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
                          title="Ver detalhes"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
        </tbody>
      </table>
    </div>
  )
}
