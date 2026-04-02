import { useEffect, useRef, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import type { ChatMessage } from '@/lib/api'
import { Search, Bot, User, MessageSquare } from 'lucide-react'

interface Props {
  telefone: string
  nome: string
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isHuman = msg.type === 'human'

  return (
    <div className={`flex items-end gap-2 ${isHuman ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
        isHuman ? 'bg-cyan-500/20' : 'bg-zinc-700/60'
      }`}>
        {isHuman
          ? <User className="h-3.5 w-3.5 text-cyan-400" />
          : <Bot className="h-3.5 w-3.5 text-zinc-400" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
        isHuman
          ? 'bg-cyan-500/20 text-white rounded-br-sm border border-cyan-500/20'
          : 'bg-zinc-800/80 text-zinc-200 rounded-bl-sm border border-white/[0.06]'
      }`}>
        {msg.content}
      </div>
    </div>
  )
}

export default function ChatView({ telefone, nome }: Props) {
  const [messages, setMessages]   = useState<ChatMessage[]>([])
  const [filtered, setFiltered]   = useState<ChatMessage[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const msgs = await api.getChatHistory(telefone)
      setMessages(msgs)
      setFiltered(msgs)
    } catch {
      setMessages([])
      setFiltered([])
    } finally {
      setLoading(false)
    }
  }, [telefone])

  useEffect(() => { load() }, [load])

  // Scroll automático para última mensagem
  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [loading, filtered])

  // Filtro de busca
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(messages)
    } else {
      const q = search.toLowerCase()
      setFiltered(messages.filter(m => m.content.toLowerCase().includes(q)))
    }
  }, [search, messages])

  const humanCount = messages.filter(m => m.type === 'human').length
  const aiCount    = messages.filter(m => m.type === 'ai').length

  if (loading) {
    return (
      <div className="flex flex-col h-[480px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="h-10 rounded-2xl bg-white/[0.05] animate-pulse"
                style={{ width: `${40 + (i % 3) * 20}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <div className="h-12 w-12 rounded-full bg-zinc-800/60 flex items-center justify-center mb-3">
          <MessageSquare className="h-6 w-6 text-zinc-600" />
        </div>
        <p className="text-sm text-zinc-500">Nenhuma mensagem encontrada</p>
        <p className="text-xs text-zinc-600 mt-1">{telefone}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[520px]">
      {/* Header do chat */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <span className="text-xs font-bold text-cyan-400 uppercase">
              {nome ? nome.split(' ').map(n => n[0]).join('').slice(0, 2) : '?'}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{nome}</p>
            <p className="text-xs text-zinc-500">{telefone}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3 text-cyan-400" />
            {humanCount}
          </span>
          <span className="flex items-center gap-1">
            <Bot className="h-3 w-3 text-zinc-400" />
            {aiCount}
          </span>
        </div>
      </div>

      {/* Busca */}
      <div className="px-4 py-2.5 border-b border-white/[0.04] shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar na conversa..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-800/60 border border-zinc-700/50 rounded-lg text-zinc-300 placeholder-zinc-600 outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
        {search && (
          <p className="text-[10px] text-zinc-600 mt-1 pl-1">
            {filtered.length} de {messages.length} mensagens
          </p>
        )}
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filtered.length === 0 && search ? (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            Nenhuma mensagem contém "{search}"
          </div>
        ) : (
          filtered.map(msg => (
            <MessageBubble key={msg.id} msg={msg} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
