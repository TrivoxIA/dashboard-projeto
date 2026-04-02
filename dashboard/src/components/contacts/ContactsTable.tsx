import { formatRelativeTime } from '@/lib/utils'
import { Phone, MessageSquare } from 'lucide-react'

export interface ContactRow {
  telefone: string
  nome: string
  ultima_mensagem: string | null
  message_count: number
}

interface Props {
  data: ContactRow[]
  loading: boolean
  onView: (telefone: string) => void
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const SKELETON = Array.from({ length: 8 })

export default function ContactsTable({ data, loading, onView }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-700/50">
            <th className="text-left text-xs font-medium text-zinc-400 px-5 py-3">Contato</th>
            <th className="text-left text-xs font-medium text-zinc-400 px-5 py-3">Telefone</th>
            <th className="text-left text-xs font-medium text-zinc-400 px-5 py-3">Mensagens</th>
            <th className="text-left text-xs font-medium text-zinc-400 px-5 py-3 hidden lg:table-cell">Última interação</th>
            <th className="text-left text-xs font-medium text-zinc-400 px-5 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? SKELETON.map((_, i) => (
                <tr key={i} className="border-b border-zinc-700/30">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-5 py-3.5">
                      <div className="h-3.5 rounded bg-zinc-700/50 animate-pulse" style={{ width: j === 0 ? 140 : 100 }} />
                    </td>
                  ))}
                </tr>
              ))
            : data.length === 0
              ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-zinc-500 text-sm">
                    Nenhum contato encontrado.
                  </td>
                </tr>
              )
              : data.map(contact => (
                <tr
                  key={contact.telefone}
                  className="border-b border-zinc-700/30 hover:bg-zinc-700/10 transition-colors cursor-pointer group"
                  onClick={() => onView(contact.telefone)}
                >
                  {/* Contato */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-zinc-700/60 flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-zinc-400">{getInitials(contact.nome)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                          {contact.nome}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {contact.ultima_mensagem ? formatRelativeTime(contact.ultima_mensagem) : '—'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Telefone */}
                  <td className="px-5 py-3.5 text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span className="text-xs font-mono">{contact.telefone}</span>
                    </div>
                  </td>

                  {/* Total de mensagens */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
                      <span className="font-medium text-white">{contact.message_count}</span>
                      <span className="text-xs text-zinc-500">msgs</span>
                    </div>
                  </td>

                  {/* Última interação */}
                  <td className="px-5 py-3.5 text-zinc-400 hidden lg:table-cell text-xs">
                    {contact.ultima_mensagem ? formatRelativeTime(contact.ultima_mensagem) : '—'}
                  </td>

                  {/* Abrir chat */}
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
