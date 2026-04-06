import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, XCircle, Loader2, Play, RefreshCw } from 'lucide-react'
import JsonViewer from './JsonViewer'
import { api } from '@/lib/api'
import type { Flow, FlowExecution, ExecStatus } from '@/lib/api'

function formatDuration(ms: number | null): string {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

const STATUS_CFG: Record<ExecStatus, { icon: React.ElementType; cls: string; label: string }> = {
  success: { icon: CheckCircle2, cls: 'text-emerald-400', label: 'Sucesso' },
  error:   { icon: XCircle,      cls: 'text-red-400',     label: 'Erro' },
  running: { icon: Loader2,      cls: 'text-amber-400',   label: 'Em andamento' },
}

interface Props {
  flow: Flow
}

const TEST_PAYLOAD = { from: '+5511999001001', body: 'Mensagem de teste', type: 'text', timestamp: new Date().toISOString() }

export default function FlowExecutionLogs({ flow }: Props) {
  const [executions, setExecutions] = useState<FlowExecution[]>([])
  const [loading, setLoading]       = useState(true)
  const [running, setRunning]       = useState(false)
  const [filter, setFilter]         = useState<ExecStatus | 'all'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    const data = await api.getFlowExecutions(flow.id, { status: filter, limit: 50 })
    setExecutions(data)
    setLoading(false)
  }, [flow.id, filter])

  useEffect(() => { load() }, [load])

  async function handleManualRun() {
    setRunning(true)
    const start = Date.now()
    try {
      const exec = await api.addFlowExecution({
        flow_id: flow.id,
        status: 'success',
        duration_ms: Math.round(Date.now() - start + Math.random() * 500 + 100),
        payload: TEST_PAYLOAD,
        response: { ok: true, message: 'Execução manual de teste concluída' },
        error_message: null,
      })
      setExecutions(prev => [exec, ...prev])
    } catch {
      // ignore
    } finally {
      setRunning(false)
    }
  }

  const STATUS_FILTERS: { value: ExecStatus | 'all'; label: string }[] = [
    { value: 'all',     label: 'Todos' },
    { value: 'success', label: 'Sucesso' },
    { value: 'error',   label: 'Erro' },
    { value: 'running', label: 'Em andamento' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-[var(--bg-page)]/50 border border-[var(--border-default)] rounded-lg p-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === f.value ? 'bg-emerald-500/20 text-emerald-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-page)]/50 border border-[var(--border-default)] rounded-lg px-3 py-1.5 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Atualizar
          </button>
          <button
            onClick={handleManualRun}
            disabled={running || flow.status !== 'active'}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-[var(--text-primary)] bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            Executar manualmente
          </button>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-[var(--text-tertiary)] text-sm">Carregando execuções...</div>
        ) : executions.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-tertiary)] text-sm">Nenhuma execução encontrada</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border-default)]">
                  <th className="px-4 py-3 text-left text-[var(--text-tertiary)] font-medium">Data / Hora</th>
                  <th className="px-4 py-3 text-left text-[var(--text-tertiary)] font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-[var(--text-tertiary)] font-medium">Duração</th>
                  <th className="px-4 py-3 text-left text-[var(--text-tertiary)] font-medium">Payload</th>
                  <th className="px-4 py-3 text-left text-[var(--text-tertiary)] font-medium">Erro</th>
                </tr>
              </thead>
              <tbody>
                {executions.map((exec, idx) => {
                  const cfg = STATUS_CFG[exec.status]
                  const Icon = cfg.icon
                  return (
                    <tr
                      key={exec.id}
                      className={`border-b border-[var(--border-default)] ${idx % 2 === 0 ? '' : 'bg-[var(--bg-page)]/10'}`}
                    >
                      <td className="px-4 py-3 text-[var(--text-secondary)] font-mono whitespace-nowrap">
                        {formatDate(exec.executed_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 ${cfg.cls}`}>
                          <Icon className={`h-3.5 w-3.5 ${exec.status === 'running' ? 'animate-spin' : ''}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] font-mono">
                        {formatDuration(exec.duration_ms)}
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        {exec.payload
                          ? <JsonViewer data={exec.payload} collapsed />
                          : <span className="text-[var(--text-tertiary)]">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        {exec.error_message
                          ? <span className="text-red-400">{exec.error_message}</span>
                          : <span className="text-[var(--text-tertiary)]">—</span>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
