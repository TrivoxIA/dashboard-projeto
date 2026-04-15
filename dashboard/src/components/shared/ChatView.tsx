import { useEffect, useRef, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import type { ChatMessage } from '@/lib/api'
import { Search, Bot, User, MessageSquare, Loader2 } from 'lucide-react'

const PAGE_SIZE = 50

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
        isHuman ? 'bg-cyan-500/20' : 'bg-[var(--sidebar-active-bg)]'
      }`}>
        {isHuman
          ? <User className="h-3.5 w-3.5 text-[var(--sidebar-active-text)]" />
          : <Bot className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
        isHuman
          ? 'bg-cyan-500/20 text-[var(--text-primary)] rounded-br-sm border border-cyan-500/20'
          : 'bg-[var(--bg-page)]/80 text-zinc-200 rounded-bl-sm border border-[var(--border-default)]'
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
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore]     = useState(false)
  const [search, setSearch]       = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { messages: msgs, hasMore: more } = await api.getChatHistory(telefone, PAGE_SIZE)
      setMessages(msgs)
      setFiltered(msgs)
      setHasMore(more)
    } catch {
      setMessages([])
      setFiltered([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [telefone])

  useEffect(() => { load() }, [load])

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return
    setLoadingMore(true)
    const container = scrollRef.current
    const prevHeight = container?.scrollHeight ?? 0
    try {
      const { messages: older, hasMore: more } = await api.getChatHistory(
        telefone,
        PAGE_SIZE,
        messages[0].id,
      )
      setMessages(prev => [...older, ...prev])
      setHasMore(more)
      setTimeout(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevHeight
        }
      }, 0)
    } finally {
      setLoadingMore(false)
    }
  }, [telefone, loadingMore, hasMore, messages])

  // Scroll automático para última mensagem (apenas no load inicial)
  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto' })
      }, 100)
    }
  }, [loading])

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
                className="h-10 rounded-2xl bg-[var(--border-zinc)]/30 animate-pulse"
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
        <div className="h-12 w-12 rounded-full bg-[var(--bg-page)]/60 flex items-center justify-center mb-3">
          <MessageSquare className="h-6 w-6 text-[var(--text-tertiary)]" />
        </div>
        <p className="text-sm text-[var(--text-tertiary)]">Nenhuma mensagem encontrada</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">{telefone}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[520px]">
      {/* Header do chat */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <span className="text-xs font-bold text-[var(--sidebar-active-text)] uppercase">
              {nome ? nome.split(' ').map(n => n[0]).join('').slice(0, 2) : '?'}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{nome}</p>
            <p className="text-xs text-[var(--text-tertiary)]">{telefone}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3 text-[var(--sidebar-active-text)]" />
            {humanCount}
          </span>
          <span className="flex items-center gap-1">
            <Bot className="h-3 w-3 text-[var(--text-secondary)]" />
            {aiCount}
          </span>
        </div>
      </div>

      {/* Busca */}
      <div className="px-4 py-2.5 border-b border-white/[0.04] shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar na conversa..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-page)]/60 border border-[var(--border-zinc)] rounded-lg text-[var(--text-primary)] placeholder-zinc-600 outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
        {search && (
          <p className="text-[10px] text-[var(--text-tertiary)] mt-1 pl-1">
            {filtered.length} de {messages.length} mensagens
          </p>
        )}
      </div>

      {/* Mensagens */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {hasMore && !search && (
          <div className="flex justify-center pb-2">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-zinc)] hover:bg-[var(--sidebar-active-bg)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {loadingMore ? 'Carregando...' : 'Carregar mensagens anteriores'}
            </button>
          </div>
        )}
        {filtered.length === 0 && search ? (
          <div className="flex items-center justify-center h-full text-[var(--text-tertiary)] text-sm">
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
