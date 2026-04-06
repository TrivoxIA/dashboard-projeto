import { Clock } from 'lucide-react'

export interface Lead {
  id: string
  name: string
  phone: string
  email: string | null
  company: string | null
  stage_id: string
  source: 'whatsapp' | 'manual'
  score: number
  notes: string | null
  session_id: string | null
  last_message_at: string | null
  created_at: string
  updated_at: string
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d}d`
}

interface Props {
  lead: Lead
  onDragStart: (e: React.DragEvent, leadId: string) => void
}

export default function LeadCard({ lead, onDragStart }: Props) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead.id)}
      className="bg-[#27272a] rounded-lg p-3 cursor-grab active:cursor-grabbing border border-zinc-700/50 hover:border-zinc-600 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-white truncate">{lead.name}</p>
        {lead.score > 0 && (
          <span className="text-[10px] font-bold text-amber-400 bg-amber-400/15 px-1.5 py-0.5 rounded shrink-0">
            {lead.score}
          </span>
        )}
      </div>

      {lead.phone && (
        <p className="text-xs text-zinc-400 mt-1">{lead.phone}</p>
      )}

      {lead.company && (
        <p className="text-xs text-zinc-500 mt-0.5 truncate">{lead.company}</p>
      )}

      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
              lead.source === 'whatsapp'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-zinc-600/40 text-zinc-400'
            }`}
          >
            {lead.source === 'whatsapp' ? 'WhatsApp' : 'Manual'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-zinc-500">
          {lead.last_message_at && (
            <span className="flex items-center gap-0.5 text-[10px]">
              <Clock className="h-3 w-3" />
              {timeAgo(lead.last_message_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
