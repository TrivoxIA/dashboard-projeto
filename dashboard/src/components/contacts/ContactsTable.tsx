import { formatRelativeTime } from '@/lib/utils'
import { Eye, Trash2 } from 'lucide-react'

export interface ContactRow {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  created_at: string
  conversations_count: number
  last_interaction: string | null
}

interface Props {
  data: ContactRow[]
  loading: boolean
  onView: (id: string) => void
  onDelete: (id: string, name: string) => void
}

const SKELETON = Array.from({ length: 8 })

export default function ContactsTable({ data, loading, onView, onDelete }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.05]">
            {['Nome', 'E-mail', 'Telefone', 'Empresa', 'Conversas', 'Última interação', ''].map(col => (
              <th key={col} className="text-left text-xs font-medium text-slate-500 px-5 py-3 whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? SKELETON.map((_, i) => (
                <tr key={i} className="border-b border-white/[0.03]">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-5 py-3.5">
                      <div className="h-3.5 rounded bg-white/[0.05] animate-pulse" style={{ width: j === 0 ? 140 : j === 6 ? 64 : 100 }} />
                    </td>
                  ))}
                </tr>
              ))
            : data.length === 0
              ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500 text-sm">
                    Nenhum contato encontrado.
                  </td>
                </tr>
              )
              : data.map(contact => (
                <tr
                  key={contact.id}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-slate-400 uppercase">{contact.name[0]}</span>
                      </div>
                      <button
                        onClick={() => onView(contact.id)}
                        className="font-medium text-white hover:text-emerald-400 transition-colors truncate max-w-[140px] text-left"
                      >
                        {contact.name}
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 truncate max-w-[160px]">{contact.email ?? '—'}</td>
                  <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">{contact.phone ?? '—'}</td>
                  <td className="px-5 py-3.5 text-slate-400 truncate max-w-[120px]">{contact.company ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400">
                      {contact.conversations_count}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap text-xs">
                    {contact.last_interaction ? formatRelativeTime(contact.last_interaction) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onView(contact.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(contact.id, contact.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}
