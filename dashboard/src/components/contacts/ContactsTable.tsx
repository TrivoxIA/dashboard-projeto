import { formatRelativeTime } from '@/lib/utils'
import { Phone, Mail, MoreVertical } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

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


function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function DropdownActions({ onView, onDelete }: { onView: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className="h-8 w-8 flex items-center justify-center text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-700/40 transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-44 bg-[#27272a] border border-zinc-700/50 rounded-xl shadow-2xl overflow-hidden">
          <button
            onClick={() => { setOpen(false); onView() }}
            className="w-full text-left text-sm text-zinc-300 hover:text-white hover:bg-zinc-700/40 px-3 py-2 transition-colors"
          >
            Ver Detalhes
          </button>
          <button
            onClick={() => { setOpen(false); onView() }}
            className="w-full text-left text-sm text-zinc-300 hover:text-white hover:bg-zinc-700/40 px-3 py-2 transition-colors"
          >
            Ver Conversas
          </button>
          <button
            onClick={() => { setOpen(false); onView() }}
            className="w-full text-left text-sm text-zinc-300 hover:text-white hover:bg-zinc-700/40 px-3 py-2 transition-colors"
          >
            Editar
          </button>
          <div className="border-t border-zinc-700/50" />
          <button
            onClick={() => { setOpen(false); onDelete() }}
            className="w-full text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 transition-colors"
          >
            Excluir
          </button>
        </div>
      )}
    </div>
  )
}

const SKELETON = Array.from({ length: 8 })

export default function ContactsTable({ data, loading, onView, onDelete }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-700/50 hover:bg-transparent">
            <th className="text-left text-xs font-medium text-zinc-400 px-5 py-3">Contato</th>
            <th className="text-left text-xs font-medium text-zinc-400 px-5 py-3">Telefone</th>
            <th className="text-left text-xs font-medium text-zinc-400 px-5 py-3 hidden md:table-cell">Email</th>
            <th className="text-left text-xs font-medium text-zinc-400 px-5 py-3">Conversas</th>
            <th className="text-left text-xs font-medium text-zinc-400 px-5 py-3 hidden lg:table-cell">Última interação</th>
            <th className="text-right text-xs font-medium text-zinc-400 px-5 py-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? SKELETON.map((_, i) => (
                <tr key={i} className="border-b border-zinc-700/30">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-3.5">
                      <div className="h-3.5 rounded bg-zinc-700/50 animate-pulse" style={{ width: j === 0 ? 140 : 100 }} />
                    </td>
                  ))}
                </tr>
              ))
            : data.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-zinc-500 text-sm">
                    Nenhum contato encontrado.
                  </td>
                </tr>
              )
              : data.map(contact => (
                <tr
                  key={contact.id}
                  className="border-b border-zinc-700/30 hover:bg-zinc-700/10 transition-colors"
                >
                  {/* Contato */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-zinc-700/60 flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-zinc-400">{getInitials(contact.name)}</span>
                      </div>
                      <div>
                        <button
                          onClick={() => onView(contact.id)}
                          className="font-medium text-white hover:text-cyan-400 transition-colors text-left"
                        >
                          {contact.name}
                        </button>
                        <p className="text-xs text-zinc-500">
                          {contact.last_interaction ? formatRelativeTime(contact.last_interaction) : '—'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Telefone */}
                  <td className="px-5 py-3.5 text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 shrink-0" />
                      {contact.phone ?? '—'}
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-5 py-3.5 text-zinc-400 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 shrink-0" />
                      {contact.email ?? '—'}
                    </div>
                  </td>

                  {/* Conversas */}
                  <td className="px-5 py-3.5 font-medium text-white">
                    {contact.conversations_count}
                  </td>

                  {/* Última interação */}
                  <td className="px-5 py-3.5 text-zinc-400 hidden lg:table-cell text-xs">
                    {contact.last_interaction ? formatRelativeTime(contact.last_interaction) : '—'}
                  </td>

                  {/* Ações */}
                  <td className="px-5 py-3.5 text-right">
                    <DropdownActions
                      onView={() => onView(contact.id)}
                      onDelete={() => onDelete(contact.id, contact.name)}
                    />
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}
