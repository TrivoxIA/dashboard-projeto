import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Building2, Calendar, User } from 'lucide-react'
import ConversationTimeline from './ConversationTimeline'
import ConversationActions from './ConversationActions'

interface Agent { id: string; name: string }

interface Conversation {
  id: string; status: string; department: string
  started_at: string; ended_at: string | null
  contacts: { id: string; name: string } | null
  agents: Agent | null
}

const STATUS_CFG = {
  resolved: { label: 'Resolvido', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  pending:  { label: 'Pendente',  cls: 'bg-amber-500/15  text-amber-400  border-amber-500/20'  },
  open:     { label: 'Aberto',    cls: 'bg-blue-500/15   text-blue-400   border-blue-500/20'   },
} as const

interface Props {
  conversationId: string
  onToast: (msg: string, type?: 'success' | 'error') => void
}

export default function ConversationDetail({ conversationId, onToast }: Props) {
  const [conv, setConv] = useState<Conversation | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [notes] = useState<string[]>([])

  async function load() {
    setLoading(true)
    const [{ data: c }, { data: agts }] = await Promise.all([
      supabase
        .from('conversations')
        .select('id, status, department, started_at, ended_at, contacts(id, name), agents(id, name)')
        .eq('id', conversationId)
        .single(),
      supabase.from('agents').select('id, name').eq('status', 'active'),
    ])
    setConv(c as any)
    setAgents(agts ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [conversationId])

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-white/[0.04] animate-pulse" />)}
    </div>
  )
  if (!conv) return <p className="text-slate-500 text-sm">Conversa não encontrada.</p>

  const cfg = STATUS_CFG[conv.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.open
  const contact = conv.contacts as any
  const agent   = conv.agents as any

  function fmtDate(d: string) {
    return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const durationSec = conv.ended_at
    ? Math.round((new Date(conv.ended_at).getTime() - new Date(conv.started_at).getTime()) / 1000)
    : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Coluna principal */}
      <div className="lg:col-span-3 space-y-5">
        {/* Info geral */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">{contact?.name ?? 'Contato desconhecido'}</h3>
            <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', cfg.cls)}>{cfg.label}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: User,      label: 'Agente',       value: agent?.name ?? '—' },
              { icon: Building2, label: 'Departamento', value: conv.department },
              { icon: Calendar,  label: 'Início',       value: fmtDate(conv.started_at) },
              { icon: Calendar,  label: 'Encerramento', value: conv.ended_at ? fmtDate(conv.ended_at) : '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xs text-slate-500">{label}</span>
                </div>
                <p className="text-sm text-white truncate">{value}</p>
              </div>
            ))}
          </div>
          {durationSec !== null && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-slate-500">Duração total</span>
              <span className="text-sm font-semibold text-white">
                {durationSec < 60 ? `${durationSec}s` : `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`}
              </span>
            </div>
          )}
        </div>

        {/* Timeline */}
        <ConversationTimeline
          startedAt={conv.started_at}
          endedAt={conv.ended_at}
          agentName={agent?.name ?? 'Agente'}
          status={conv.status}
          notes={notes}
        />
      </div>

      {/* Coluna de ações */}
      <div className="lg:col-span-2">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <ConversationActions
            conversationId={conv.id}
            currentStatus={conv.status as any}
            currentAgentId={agent?.id ?? null}
            agents={agents}
            onUpdated={load}
            onToast={onToast}
          />
        </div>
      </div>
    </div>
  )
}
