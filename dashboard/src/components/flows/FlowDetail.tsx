import { useState } from 'react'
import { X, Info, FileText, GitMerge } from 'lucide-react'
import FlowStatusBadge from './FlowStatusBadge'
import WebhookUrlCopy from './WebhookUrlCopy'
import JsonViewer from './JsonViewer'
import FlowExecutionLogs from './FlowExecutionLogs'
import FlowFieldMapping from './FlowFieldMapping'
import type { Flow } from '@/lib/api'

type Tab = 'info' | 'logs' | 'mapping'

const TYPE_LABEL: Record<string, string> = {
  webhook:   'Webhook',
  scheduled: 'Agendado',
  manual:    'Manual',
}

interface Props {
  flow: Flow
  onClose: () => void
  onUpdated: (flow: Flow) => void
}

export default function FlowDetail({ flow: initialFlow, onClose, onUpdated }: Props) {
  const [tab, setTab]   = useState<Tab>('info')
  const [flow, setFlow] = useState<Flow>(initialFlow)

  function handleUpdated(updated: Flow) {
    setFlow(updated)
    onUpdated(updated)
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'info',    label: 'Informações', icon: Info },
    { id: 'logs',    label: 'Execuções',   icon: FileText },
    { id: 'mapping', label: 'Mapeamento',  icon: GitMerge },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[var(--bg-card)] border border-[var(--border-medium)] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[var(--border-default)] shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">{flow.name}</h2>
                <FlowStatusBadge status={flow.status} size="sm" />
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">
                {TYPE_LABEL[flow.type]} · Criado em {new Date(flow.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mt-0.5">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 py-2 border-b border-[var(--border-default)] shrink-0">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                  tab === t.id ? 'bg-[var(--border-zinc)]/50 text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'info' && (
            <div className="space-y-4">
              {flow.description && (
                <p className="text-sm text-[var(--text-secondary)]">{flow.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Tipo',              value: TYPE_LABEL[flow.type] },
                  { label: 'Status',            value: <FlowStatusBadge status={flow.status} size="sm" /> },
                  { label: 'Total de execuções', value: flow.total_executions.toLocaleString('pt-BR') },
                  {
                    label: 'Taxa de sucesso',
                    value: flow.total_executions > 0
                      ? `${Math.round(flow.successful_executions / flow.total_executions * 100)}%`
                      : '—'
                  },
                  {
                    label: 'Última execução',
                    value: flow.last_executed_at
                      ? new Date(flow.last_executed_at).toLocaleString('pt-BR')
                      : '—'
                  },
                  { label: 'Criado em', value: new Date(flow.created_at).toLocaleString('pt-BR') },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[var(--bg-page)]/40 border border-[var(--border-default)] rounded-lg px-3 py-2.5">
                    <p className="text-[11px] text-[var(--text-tertiary)] mb-0.5">{label}</p>
                    <p className="text-sm text-[var(--text-primary)]">{value}</p>
                  </div>
                ))}
              </div>

              {flow.type === 'webhook' && flow.webhook_url && (
                <div>
                  <p className="text-xs text-[var(--text-tertiary)] mb-1.5">URL do Webhook</p>
                  <WebhookUrlCopy url={flow.webhook_url} />
                </div>
              )}

              {flow.type === 'scheduled' && flow.cron_expression && (
                <div>
                  <p className="text-xs text-[var(--text-tertiary)] mb-1.5">Expressão Cron</p>
                  <div className="bg-[var(--bg-sidebar)] border border-[var(--border-default)] rounded-lg px-3 py-2">
                    <code className="text-sm text-amber-300 font-mono">{flow.cron_expression}</code>
                  </div>
                </div>
              )}

              {Object.keys(flow.config ?? {}).length > 0 && (
                <div>
                  <p className="text-xs text-[var(--text-tertiary)] mb-1.5">Configuração</p>
                  <JsonViewer data={flow.config} />
                </div>
              )}
            </div>
          )}

          {tab === 'logs' && <FlowExecutionLogs flow={flow} />}

          {tab === 'mapping' && <FlowFieldMapping flow={flow} onUpdated={handleUpdated} />}
        </div>
      </div>
    </div>
  )
}
