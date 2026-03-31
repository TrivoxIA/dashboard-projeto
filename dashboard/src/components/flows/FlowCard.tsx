import { Webhook, Clock4, Calendar, Play, Edit2, Power, FileText, Trash2 } from 'lucide-react'
import FlowStatusBadge from './FlowStatusBadge'
import WebhookUrlCopy from './WebhookUrlCopy'
import type { Flow } from '@/lib/api'

const STATUS_BORDER: Record<string, string> = {
  active:   'border-l-emerald-500',
  inactive: 'border-l-slate-600',
  error:    'border-l-red-500',
}

const TYPE_ICON: Record<string, React.ElementType> = {
  webhook:   Webhook,
  scheduled: Clock4,
  manual:    Play,
}

const TYPE_LABEL: Record<string, string> = {
  webhook:   'Webhook',
  scheduled: 'Agendado',
  manual:    'Manual',
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'agora'
  if (mins < 60)  return `há ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `há ${hrs}h`
  return `há ${Math.floor(hrs / 24)}d`
}

function successRate(flow: Flow): number {
  if (!flow.total_executions) return 0
  return Math.round((flow.successful_executions / flow.total_executions) * 100)
}

interface Props {
  flow: Flow
  onEdit:   (flow: Flow) => void
  onToggle: (flow: Flow) => void
  onLogs:   (flow: Flow) => void
  onDelete: (flow: Flow) => void
}

export default function FlowCard({ flow, onEdit, onToggle, onLogs, onDelete }: Props) {
  const TypeIcon = TYPE_ICON[flow.type] ?? Play
  const rate = successRate(flow)

  return (
    <div
      className={`bg-[#13131f] border border-white/[0.06] border-l-2 ${STATUS_BORDER[flow.status]} rounded-xl p-5 flex flex-col gap-4 hover:border-r-white/[0.10] transition-colors`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FlowStatusBadge status={flow.status} size="sm" />
            <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-white/[0.05] px-1.5 py-0.5 rounded-full">
              <TypeIcon className="h-2.5 w-2.5" />
              {TYPE_LABEL[flow.type]}
            </span>
          </div>
          <h3 className="font-semibold text-white text-sm truncate">{flow.name}</h3>
          {flow.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{flow.description}</p>
          )}
        </div>
      </div>

      {/* Webhook URL */}
      {flow.type === 'webhook' && flow.webhook_url && (
        <WebhookUrlCopy url={flow.webhook_url} />
      )}

      {/* Cron */}
      {flow.type === 'scheduled' && flow.cron_expression && (
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
          <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <code className="text-xs text-slate-400 font-mono">{flow.cron_expression}</code>
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/[0.03] rounded-lg px-2 py-2 text-center">
          <p className="text-sm font-bold text-white">{flow.total_executions.toLocaleString('pt-BR')}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Execuções</p>
        </div>
        <div className="bg-white/[0.03] rounded-lg px-2 py-2 text-center">
          <p className={`text-sm font-bold ${rate >= 90 ? 'text-emerald-400' : rate >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
            {rate}%
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Sucesso</p>
        </div>
        <div className="bg-white/[0.03] rounded-lg px-2 py-2 text-center">
          <p className="text-xs font-medium text-slate-300">{relativeTime(flow.last_executed_at)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Última exec.</p>
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center justify-end gap-1 pt-1 border-t border-white/[0.04]">
        <button
          onClick={() => onEdit(flow)}
          title="Editar"
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onToggle(flow)}
          title={flow.status === 'active' ? 'Desativar' : 'Ativar'}
          className={`p-1.5 rounded-lg transition-colors ${
            flow.status === 'active'
              ? 'text-emerald-400 hover:text-white hover:bg-red-500/10'
              : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10'
          }`}
        >
          <Power className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onLogs(flow)}
          title="Ver logs"
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <FileText className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(flow)}
          title="Excluir"
          disabled={flow.status === 'active'}
          className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export function FlowCardSkeleton() {
  return (
    <div className="bg-[#13131f] border border-white/[0.06] border-l-2 border-l-slate-700 rounded-xl p-5 space-y-4">
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="h-4 w-14 rounded-full bg-white/[0.06] animate-pulse" />
          <div className="h-4 w-16 rounded-full bg-white/[0.04] animate-pulse" />
        </div>
        <div className="h-4 w-40 rounded bg-white/[0.06] animate-pulse" />
        <div className="h-3 w-56 rounded bg-white/[0.04] animate-pulse" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1,2,3].map(i => <div key={i} className="h-14 rounded-lg bg-white/[0.04] animate-pulse" />)}
      </div>
    </div>
  )
}
