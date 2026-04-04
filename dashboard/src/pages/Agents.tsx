import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import AgentGrid from '@/components/agents/AgentGrid'
import AgentFilters, { type AgentFilterState } from '@/components/agents/AgentFilters'
import AgentDetail from '@/components/agents/AgentDetail'
import AgentForm from '@/components/agents/AgentForm'
import Modal from '@/components/shared/Modal'
import { useToast, ToastContainer } from '@/components/shared/Toast'
import { Plus } from 'lucide-react'
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

    const [{ data: agentRows }, { data: metricsRows }] = await Promise.all([
      supabase.from('agents').select('id, name, department, status, created_at').order('name'),
      supabase.from('v_agent_metrics').select('*'),
    ])

    const rows = agentRows ?? []
    const metricsMap = new Map<string, any>()
    for (const m of (metricsRows ?? [])) {
      metricsMap.set(m.agent_id, m)
    }

    const result: AgentCardData[] = rows.map(agent => {
      const m = metricsMap.get(agent.id)
      return {
        id:              agent.id,
        name:            agent.name,
        department:      agent.department,
        status:          agent.status as AgentStatus,
        total:           m?.total_conversas ?? 0,
        resolved:        m?.resolvidas ?? 0,
        resolutionRate:  m?.taxa_resolucao ?? 0,
        avgResponseTime: m?.tempo_medio_resposta_seg ?? 0,
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

  async function handleToggle(id: string, next: AgentStatus) {
    await supabase.from('agents').update({ status: next }).eq('id', id)
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status: next } : a))
  }

  return (
    <AppLayout>
      <ToastContainer toasts={toasts} onRemove={remove} />
      <div className="p-6 space-y-6 max-w-[1400px]">

        {/* Header — V0 style */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Agentes</h1>
            <p className="text-zinc-400">Gerencie e monitore os seus agentes de IA</p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 text-sm font-medium text-[#18181b] bg-cyan-500 hover:bg-cyan-400 rounded-lg px-4 py-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Agente
          </button>
        </div>

        {/* Filtros */}
        <AgentFilters filters={filters} onChange={p => setFilters(prev => ({ ...prev, ...p }))} />

        {/* Grid */}
        <AgentGrid agents={filtered} loading={loading} onSelect={setSelectedId} onToggle={handleToggle} />
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
