import { GitBranch, Play, Pause, Copy, MoreVertical, Calendar, Webhook } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import type { Flow } from '@/lib/api'

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

function DropdownMenu({ onEdit, onLogs, onDelete, canDelete }: {
  onEdit: () => void
  onLogs: () => void
  onDelete: () => void
  canDelete: boolean
}) {
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
        className="h-8 w-8 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--sidebar-hover-bg)] transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-44 bg-[var(--bg-card)] border border-[var(--border-zinc)] rounded-xl shadow-2xl overflow-hidden">
          <button onClick={() => { setOpen(false); onEdit() }}
            className="w-full flex items-center gap-2 text-sm text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--sidebar-hover-bg)] px-3 py-2 transition-colors">
            <Copy className="h-4 w-4" /> Duplicar
          </button>
          <button onClick={() => { setOpen(false); onEdit() }}
            className="w-full text-left text-sm text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--sidebar-hover-bg)] px-3 py-2 transition-colors">
            Editar
          </button>
          <button onClick={() => { setOpen(false); onLogs() }}
            className="w-full text-left text-sm text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--sidebar-hover-bg)] px-3 py-2 transition-colors">
            Ver Analytics
          </button>
          {canDelete && (
            <>
              <div className="border-t border-[var(--border-zinc)]" />
              <button onClick={() => { setOpen(false); onDelete() }}
                className="w-full text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 transition-colors">
                Excluir
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

interface Props {
  flow: Flow
  onEdit:   (flow: Flow) => void
  onToggle: (flow: Flow) => void
  onLogs:   (flow: Flow) => void
  onDelete: (flow: Flow) => void
}

export default function FlowCard({ flow, onEdit, onToggle, onLogs, onDelete }: Props) {
  const isActive = flow.status === 'active'
  const rate = successRate(flow)

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-zinc)] rounded-xl hover:border-cyan-500/30 transition-all">
      {/* Header */}
      <div className="flex flex-row items-start justify-between p-5 pb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--border-zinc)]/50 shrink-0">
            {flow.type === 'webhook'   ? <Webhook   className="h-5 w-5 text-[var(--text-secondary)]" /> :
             flow.type === 'scheduled' ? <Calendar  className="h-5 w-5 text-[var(--text-secondary)]" /> :
                                        <GitBranch  className="h-5 w-5 text-[var(--text-secondary)]" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-[var(--text-primary)] line-clamp-1">{flow.name}</h3>
            {flow.description && (
              <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 mt-1">{flow.description}</p>
            )}
          </div>
        </div>
        <DropdownMenu
          onEdit={() => onEdit(flow)}
          onLogs={() => onLogs(flow)}
          onDelete={() => onDelete(flow)}
          canDelete={!isActive}
        />
      </div>

      {/* Badge + type */}
      <div className="px-5 pb-3 flex items-center justify-between">
        <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${
          isActive
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            : flow.status === 'error'
              ? 'bg-red-500/20 text-red-400 border-red-500/30'
              : 'bg-[var(--border-zinc)]/50 text-[var(--text-secondary)] border-zinc-600/50'
        }`}>
          {isActive ? 'Ativo' : flow.status === 'error' ? 'Erro' : 'Inativo'}
        </span>
        <span className="text-xs text-[var(--text-tertiary)]">{flow.type}</span>
      </div>

      {/* Stats */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-2 gap-2 text-center mb-4">
          <div className="rounded-lg bg-[var(--bg-page)]/60 p-2">
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              {flow.total_executions.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">Execuções</p>
          </div>
          <div className="rounded-lg bg-[var(--bg-page)]/60 p-2">
            <p className={`text-sm font-medium ${rate >= 90 ? 'text-emerald-400' : rate >= 70 ? 'text-amber-400' : 'text-[var(--text-primary)]'}`}>
              {relativeTime(flow.last_executed_at)}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">Última exec.</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(flow)}
            className="flex-1 text-sm font-medium text-[var(--text-primary)] border border-[var(--border-zinc)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--text-primary)] rounded-lg py-1.5 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => onToggle(flow)}
            className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium rounded-lg py-1.5 transition-colors ${
              isActive
                ? 'border border-[var(--border-zinc)] text-[var(--text-primary)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--text-primary)]'
                : 'bg-cyan-500 hover:bg-cyan-400 text-[#18181b]'
            }`}
          >
            {isActive ? (
              <><Pause className="h-3 w-3" /> Pausar</>
            ) : (
              <><Play className="h-3 w-3" /> Ativar</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export function FlowCardSkeleton() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-zinc)] rounded-xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-[var(--border-zinc)]/50 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-[var(--border-zinc)]/50 animate-pulse" />
          <div className="h-3 w-48 rounded bg-[var(--sidebar-hover-bg)] animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="h-14 rounded-lg bg-[var(--sidebar-hover-bg)] animate-pulse" />
        <div className="h-14 rounded-lg bg-[var(--sidebar-hover-bg)] animate-pulse" />
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-8 rounded-lg bg-[var(--sidebar-hover-bg)] animate-pulse" />
        <div className="flex-1 h-8 rounded-lg bg-[var(--sidebar-hover-bg)] animate-pulse" />
      </div>
    </div>
  )
}
