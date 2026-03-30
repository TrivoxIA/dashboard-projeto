import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import AgentGrid from '@/components/agents/AgentGrid'
import AgentFilters, { type AgentFilterState } from '@/components/agents/AgentFilters'
import AgentDetail from '@/components/agents/AgentDetail'
import AgentForm from '@/components/agents/AgentForm'
import Modal from '@/components/shared/Modal'
import { useToast, ToastContainer } from '@/components/shared/Toast'
import { UserPlus } from 'lucide-react'
import type { AgentCardData } from '@/components/agents/AgentCard'
import type { AgentStatus } from '@/components/agents/AgentStatusBadge'

const EMPTY_FILTERS: AgentFilterState = { search: '', status: '', department: '' }

export default function Agents() {
  const { toasts, show, remove } = useToast()
  const [agents, setAgents] = useState<AgentCardData[]>([])
  const [filtered, setFiltered] = useState<AgentCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<AgentFilterState>(EMPTY_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)

    const { data: agentRows } = await supabase
      .from('agents')
      .select('id, name, department, status, created_at')
      .order('name')

    const rows = agentRows ?? []
    const ids  = rows.map(a => a.id)

    // Busca todas as conversas de todos os agentes de uma vez
    const { data: convRows } = ids.length > 0
      ? await supabase.from('conversations').select('agent_id, status, started_at, ended_at').in('agent_id', ids)
      : { data: [] }

    const all = convRows ?? []

    const result: AgentCardData[] = rows.map(agent => {
      const mine     = all.filter(c => c.agent_id === agent.id)
      const resolved = mine.filter(c => c.status === 'resolved')
      const durations = resolved
        .filter(c => c.ended_at)
        .map(c => (new Date(c.ended_at!).getTime() - new Date(c.started_at).getTime()) / 1000)
      const avgTime = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0

      return {
        id:              agent.id,
        name:            agent.name,
        department:      agent.department,
        status:          agent.status as AgentStatus,
        total:           mine.length,
        resolved:        resolved.length,
        resolutionRate:  mine.length > 0 ? Math.round((resolved.length / mine.length) * 100) : 0,
        avgResponseTime: avgTime,
      }
    })

    setAgents(result)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Filtragem client-side
  useEffect(() => {
    let result = agents
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase()
      result = result.filter(a => a.name.toLowerCase().includes(q))
    }
    if (filters.status)     result = result.filter(a => a.status === filters.status)
    if (filters.department) result = result.filter(a => a.department === filters.department)
    setFiltered(result)
  }, [agents, filters])

  const counts = {
    total:       agents.length,
    active:      agents.filter(a => a.status === 'active').length,
    maintenance: agents.filter(a => a.status === 'maintenance').length,
    inactive:    agents.filter(a => a.status === 'inactive').length,
  }

  return (
    <AppLayout>
      <ToastContainer toasts={toasts} onRemove={remove} />
      <div className="p-6 space-y-5 max-w-[1400px]">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-white">Agentes</h2>
            {/* Counters */}
            <div className="flex items-center gap-2">
              <span className="text-xs bg-white/[0.06] text-slate-400 border border-white/[0.08] px-2 py-0.5 rounded-full">
                {counts.total} total
              </span>
              <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                {counts.active} ativos
              </span>
              {counts.maintenance > 0 && (
                <span className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  {counts.maintenance} manutenção
                </span>
              )}
              {counts.inactive > 0 && (
                <span className="text-xs bg-slate-500/15 text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded-full">
                  {counts.inactive} inativos
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 text-sm text-white bg-emerald-500 hover:bg-emerald-400 rounded-lg px-3 py-1.5 transition-colors font-medium"
          >
            <UserPlus className="h-3.5 w-3.5" /> Novo agente
          </button>
        </div>

        {/* Filtros */}
        <AgentFilters filters={filters} onChange={p => setFilters(prev => ({ ...prev, ...p }))} />

        {/* Grid */}
        <AgentGrid agents={filtered} loading={loading} onSelect={setSelectedId} />
      </div>

      {/* Modal: Detalhe */}
      <Modal
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        title="Detalhes do agente"
        size="lg"
      >
        {selectedId && (
          <AgentDetail
            agentId={selectedId}
            onToast={show}
            onDeleted={() => { setSelectedId(null); load() }}
            onRefresh={load}
          />
        )}
      </Modal>

      {/* Modal: Novo agente */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Novo agente" description="Preencha as informações do agente">
        <AgentForm
          onSuccess={() => { setAddOpen(false); load(); show('Agente adicionado!') }}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>
    </AppLayout>
  )
}
