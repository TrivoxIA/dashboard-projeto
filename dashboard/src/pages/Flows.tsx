import { useEffect, useState, useCallback } from 'react'
import { GitBranch, Plus, RefreshCw, Activity, CheckCircle2, XCircle, PowerOff, Clock } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import FlowGrid from '@/components/flows/FlowGrid'
import FlowFilters, { type FlowFilterState } from '@/components/flows/FlowFilters'
import FlowForm from '@/components/flows/FlowForm'
import FlowDetail from '@/components/flows/FlowDetail'
import { api } from '@/lib/api'
import type { Flow, FlowsSummary } from '@/lib/api'

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

const DEFAULT_FILTERS: FlowFilterState = { search: '', status: 'all', type: 'all' }

export default function Flows() {
  const [flows,   setFlows]   = useState<Flow[]>([])
  const [summary, setSummary] = useState<FlowsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FlowFilterState>(DEFAULT_FILTERS)

  const [showForm,    setShowForm]    = useState(false)
  const [editFlow,    setEditFlow]    = useState<Flow | null>(null)
  const [detailFlow,  setDetailFlow]  = useState<Flow | null>(null)
  const [confirmDel,  setConfirmDel]  = useState<Flow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [f, s] = await Promise.all([api.getFlows(), api.getFlowsSummary()])
    setFlows(f)
    setSummary(s)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = flows.filter(f => {
    if (filters.status !== 'all' && f.status !== filters.status) return false
    if (filters.type   !== 'all' && f.type   !== filters.type)   return false
    if (filters.search && !f.name.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  async function handleToggle(flow: Flow) {
    const next = flow.status === 'active' ? 'inactive' : 'active'
    await api.updateFlow(flow.id, { status: next })
    await load()
  }

  async function handleDelete(flow: Flow) {
    if (flow.status === 'active') return
    await api.deleteFlow(flow.id)
    setConfirmDel(null)
    await load()
  }

  function handleEdit(flow: Flow) {
    setEditFlow(flow)
    setShowForm(true)
  }

  function handleLogs(flow: Flow) {
    setDetailFlow(flow)
  }

  async function handleSaved() {
    setShowForm(false)
    setEditFlow(null)
    await load()
  }

  function handleFlowUpdated(updated: Flow) {
    setFlows(prev => prev.map(f => f.id === updated.id ? updated : f))
    if (detailFlow?.id === updated.id) setDetailFlow(updated)
  }

  const SUMMARY_CARDS = [
    { icon: Activity,     label: 'Total',    value: summary?.total    ?? 0, color: '#64748b' },
    { icon: CheckCircle2, label: 'Ativos',   value: summary?.active   ?? 0, color: '#10b981' },
    { icon: PowerOff,     label: 'Inativos', value: summary?.inactive ?? 0, color: '#64748b' },
    { icon: XCircle,      label: 'Com erro', value: summary?.error    ?? 0, color: '#ef4444' },
    { icon: Clock,        label: 'Último webhook', value: relativeTime(summary?.last_webhook_at ?? null), color: '#3b82f6', isText: true },
  ]

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-[1400px]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 border border-sky-500/30">
              <GitBranch className="h-4 w-4 text-sky-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Fluxos</h2>
              <p className="text-sm text-slate-500 mt-0.5">Automações e integrações n8n</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] rounded-lg px-3 py-1.5 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Atualizar
            </button>
            <button
              onClick={() => { setEditFlow(null); setShowForm(true) }}
              className="flex items-center gap-2 text-sm text-white bg-emerald-500 hover:bg-emerald-400 rounded-lg px-4 py-1.5 font-medium transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar Fluxo
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          {SUMMARY_CARDS.map(({ icon: Icon, label, value, color, isText }) => (
            <div key={label} className="bg-[#27272a] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: color + '20', border: `1px solid ${color}30` }}
              >
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className={`font-bold ${isText ? 'text-sm text-slate-300 truncate' : 'text-xl text-white'}`}>
                  {String(value)}
                </p>
                <p className="text-[11px] text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <FlowFilters filters={filters} onChange={setFilters} />

        {/* Grid */}
        <FlowGrid
          flows={filtered}
          loading={loading}
          onEdit={handleEdit}
          onToggle={handleToggle}
          onLogs={handleLogs}
          onDelete={(flow) => flow.status !== 'active' ? setConfirmDel(flow) : undefined}
        />
      </div>

      {/* Modal: Form */}
      {showForm && (
        <FlowForm
          flow={editFlow}
          onClose={() => { setShowForm(false); setEditFlow(null) }}
          onSaved={handleSaved}
        />
      )}

      {/* Modal: Detail / Logs */}
      {detailFlow && (
        <FlowDetail
          flow={detailFlow}
          onClose={() => setDetailFlow(null)}
          onUpdated={handleFlowUpdated}
        />
      )}

      {/* Modal: Confirm delete */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#27272a] border border-white/[0.08] rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Excluir fluxo?</h3>
                <p className="text-xs text-slate-500">"{confirmDel.name}"</p>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Esta ação é irreversível. O histórico de execuções também será excluído.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDel(null)}
                className="flex-1 bg-white/[0.04] hover:bg-white/[0.07] text-slate-400 text-sm font-medium rounded-xl py-2.5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDel)}
                className="flex-1 bg-red-500 hover:bg-red-400 text-white text-sm font-medium rounded-xl py-2.5 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
