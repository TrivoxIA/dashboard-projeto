import { MessageSquare, CheckCircle2, Clock, User } from 'lucide-react'

interface TimelineEvent {
  type: 'open' | 'message' | 'assign' | 'resolve' | 'note'
  label: string
  time: string
  author?: string
}

interface Props {
  startedAt: string
  endedAt: string | null
  agentName: string
  status: string
  notes: string[]
}

export default function ConversationTimeline({ startedAt, endedAt, agentName, status, notes }: Props) {
  const events: TimelineEvent[] = [
    { type: 'open', label: 'Conversa iniciada', time: startedAt },
    { type: 'assign', label: `Atribuída a ${agentName}`, time: startedAt, author: agentName },
  ]

  notes.forEach((note) => {
    events.push({
      type: 'note',
      label: note,
      time: startedAt,
      author: agentName,
    })
  })

  if (endedAt && status === 'resolved') {
    events.push({ type: 'resolve', label: 'Conversa resolvida', time: endedAt })
  }

  const ICON_CFG = {
    open:    { Icon: MessageSquare, cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    message: { Icon: MessageSquare, cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
    assign:  { Icon: User,          cls: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    resolve: { Icon: CheckCircle2,  cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    note:    { Icon: Clock,         cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Timeline</p>
      <div className="relative">
        {/* Linha vertical */}
        <div className="absolute left-[15px] top-0 bottom-0 w-px bg-white/[0.06]" />
        <div className="space-y-4">
          {events.map((ev, i) => {
            const { Icon, cls } = ICON_CFG[ev.type]
            return (
              <div key={i} className="flex items-start gap-3 relative">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${cls} z-10 bg-[#13131f]`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-white">{ev.label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {ev.author && <span className="text-xs text-slate-500">{ev.author}</span>}
                    <span className="text-xs text-slate-600">
                      {new Date(ev.time).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
