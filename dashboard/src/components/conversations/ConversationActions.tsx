import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, RefreshCw, StickyNote, Loader2 } from 'lucide-react'

type ConvStatus = 'open' | 'pending' | 'resolved'

interface Agent { id: string; name: string }

interface Props {
  conversationId: string
  currentStatus: ConvStatus
  currentAgentId: string | null
  agents: Agent[]
  onUpdated: () => void
  onToast: (msg: string, type?: 'success' | 'error') => void
}

const NEXT_STATUS: Record<ConvStatus, ConvStatus> = {
  open: 'pending',
  pending: 'resolved',
  resolved: 'open',
}

const STATUS_LABEL: Record<ConvStatus, string> = {
  open: 'Aberto',
  pending: 'Pendente',
  resolved: 'Resolvido',
}

export default function ConversationActions({ conversationId, currentStatus, currentAgentId, agents, onUpdated, onToast }: Props) {
  const [note, setNote] = useState('')
  const [notes, setNotes] = useState<string[]>([])
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [loadingAgent, setLoadingAgent] = useState(false)
  const [savingNote, setSavingNote] = useState(false)

  const nextStatus = NEXT_STATUS[currentStatus]

  async function changeStatus() {
    setLoadingStatus(true)
    const updates: Record<string, any> = { status: nextStatus }
    if (nextStatus === 'resolved') updates.ended_at = new Date().toISOString()
    const { error } = await supabase.from('crm_conversations').update(updates).eq('id', conversationId)
    setLoadingStatus(false)
    if (error) { onToast('Erro ao atualizar status', 'error'); return }
    onToast(`Status alterado para "${STATUS_LABEL[nextStatus]}"`)
    onUpdated()
  }

  async function reassign(agentId: string) {
    setLoadingAgent(true)
    const { error } = await supabase.from('crm_conversations').update({ agent_id: agentId }).eq('id', conversationId)
    setLoadingAgent(false)
    if (error) { onToast('Erro ao reatribuir agente', 'error'); return }
    const agent = agents.find(a => a.id === agentId)
    onToast(`Atribuída para ${agent?.name ?? 'agente'}`)
    onUpdated()
  }

  function addNote() {
    if (!note.trim()) return
    setSavingNote(true)
    setTimeout(() => {
      setNotes(prev => [...prev, note.trim()])
      setNote('')
      setSavingNote(false)
      onToast('Nota adicionada')
    }, 300)
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Ações</p>

      {/* Alterar status */}
      <div className="space-y-1.5">
        <p className="text-xs text-[var(--text-secondary)]">Avançar status</p>
        <button
          onClick={changeStatus}
          disabled={loadingStatus}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 text-sm py-2 transition-colors disabled:opacity-50"
        >
          {loadingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Marcar como "{STATUS_LABEL[nextStatus]}"
        </button>
      </div>

      {/* Reatribuir agente */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          <p className="text-xs text-[var(--text-secondary)]">Reatribuir agente</p>
          {loadingAgent && <Loader2 className="h-3 w-3 text-[var(--text-tertiary)] animate-spin" />}
        </div>
        <select
          defaultValue={currentAgentId ?? ''}
          onChange={e => e.target.value && reassign(e.target.value)}
          className="w-full bg-[var(--bg-page)]/50 border border-[var(--border-medium)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
        >
          <option value="">Selecionar agente...</option>
          {agents.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Notas internas */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <StickyNote className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          <p className="text-xs text-[var(--text-secondary)]">Notas internas</p>
        </div>
        {notes.length > 0 && (
          <div className="space-y-2 mb-2">
            {notes.map((n, i) => (
              <div key={i} className="bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2 text-xs text-amber-300">{n}</div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addNote()}
            placeholder="Adicionar nota..."
            className="flex-1 bg-[var(--bg-page)]/50 border border-[var(--border-medium)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-emerald-500/50 transition-colors"
          />
          <button
            onClick={addNote}
            disabled={savingNote || !note.trim()}
            className="px-3 rounded-lg bg-[var(--border-zinc)]/40 hover:bg-[var(--border-zinc)]/50 text-[var(--text-secondary)] text-sm transition-colors disabled:opacity-30"
          >
            {savingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '+'}
          </button>
        </div>
      </div>
    </div>
  )
}
