import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatRelativeTime, cn } from '@/lib/utils'
import { Edit2, RefreshCw, Trash2 } from 'lucide-react'
import AgentStatusBadge, { type AgentStatus } from './AgentStatusBadge'
import AgentMetrics, { type AgentStats } from './AgentMetrics'
import AgentPerformanceChart from './AgentPerformanceChart'
import AgentForm from './AgentForm'
import Modal from '@/components/shared/Modal'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

const DEPT_COLOR: Record<string, string> = {
  'Suporte Técnico': '#10b981',
  'Vendas':          '#3b82f6',
  'Financeiro':      '#f59e0b',
  'RH':              '#8b5cf6',
  'Outros':          '#ef4444',
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  'Em atendimento': { label: 'Em atendimento', cls: 'bg-blue-500/15   text-blue-400   border-blue-500/20'   },
  'Agendado':       { label: 'Agendado',       cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  'Transferido':    { label: 'Transferido',     cls: 'bg-amber-500/15  text-amber-400  border-amber-500/20'  },
  'Cancelado':      { label: 'Cancelado',       cls: 'bg-red-500/15    text-red-400    border-red-500/20'    },
}
const STATUS_DEFAULT = { label: '', cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' }

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface Agent {
  id: string; name: string; department: string; status: AgentStatus; created_at: string
}
interface RecentConv {
  telefone: string; nome: string | null; status: string | null; ultima_atividade: string | null
}

interface Props {
  agentId: string
  onToast: (msg: string, type?: 'success' | 'error') => void
  onDeleted: () => void
  onRefresh: () => void
}

export default function AgentDetail({ agentId, onToast, onDeleted, onRefresh }: Props) {
  const navigate = useNavigate()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [stats, setStats] = useState<AgentStats>({ total: 0, resolved: 0, open: 0, resolutionRate: 0, avgResponseTime: 0 })
  const [chartData, setChartData] = useState<{ date: string; resolved: number }[]>([])
  const [recentConvs, setRecentConvs] = useState<RecentConv[]>([])
  const [loading, setLoading] = useState(true)

  const [editOpen, setEditOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [nextStatus, setNextStatus] = useState<AgentStatus>('active')

  async function load() {
    setLoading(true)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const y = sevenDaysAgo.getFullYear()
    const m2 = String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')
    const dd = String(sevenDaysAgo.getDate()).padStart(2, '0')
    const sevenStr = `${y}-${m2}-${dd}`

    const [{ data: a }, { data: metricsRows }, { data: chartRows }, { data: recentRows }] = await Promise.all([
      supabase.from('agents').select('*').eq('id', agentId).single(),
      supabase.from('v_agent_metrics').select('*').eq('agent_id', agentId),
      supabase.from('v_agent_conversas_dia').select('*').eq('agent_id', agentId).gte('dia', sevenStr).order('dia', { ascending: true }),
      supabase.from('v_agent_conversas_recentes').select('*').eq('agent_id', agentId).order('ultima_atividade', { ascending: false }).limit(5),
    ])

    setAgent(a as Agent)

    const m = metricsRows?.[0]
    setStats({
      total:           m?.total_conversas ?? 0,
      resolved:        m?.resolvidas ?? 0,
      open:            m?.abertas ?? 0,
      resolutionRate:  m?.taxa_resolucao ?? 0,
      avgResponseTime: m?.tempo_medio_resposta_seg ?? 0,
    })

    const chart = (chartRows ?? []).map(r => ({
      date: DAY_NAMES[new Date(r.dia + 'T12:00:00').getDay()],
      resolved: r.resolvidas ?? 0,
    }))
    setChartData(chart)

    setRecentConvs((recentRows ?? []) as RecentConv[])
    setLoading(false)
  }

  useEffect(() => { load() }, [agentId])

  async function handleStatusChange() {
    const updates: Record<string, any> = { status: nextStatus }
    const { error } = await supabase.from('agents').update(updates).eq('id', agentId)
    setStatusOpen(false)
    if (error) { onToast('Erro ao atualizar status', 'error'); return }
    onToast(`Status alterado para "${nextStatus === 'active' ? 'Ativo' : nextStatus === 'inactive' ? 'Inativo' : 'Manutenção'}"`)
    load(); onRefresh()
  }

  async function handleDelete() {
    setDeleting(true)
    const { error } = await supabase.from('agents').delete().eq('id', agentId)
    setDeleting(false)
    if (error) { onToast('Erro ao excluir agente', 'error'); return }
    onToast('Agente excluído')
    onDeleted()
  }

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-white/[0.04] animate-pulse" />)}
    </div>
  )
  if (!agent) return <p className="text-slate-500 text-sm">Agente não encontrado.</p>

  const color = DEPT_COLOR[agent.department] ?? '#64748b'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl text-base font-bold"
            style={{ backgroundColor: color + '22', border: `1px solid ${color}33`, color }}>
            {agent.name[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">{agent.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: color + '18', color }}>
                {agent.department}
              </span>
              <AgentStatusBadge status={agent.status} size="sm" />
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500">Desde {new Date(agent.created_at).toLocaleDateString('pt-BR')}</p>
      </div>

      {/* Métricas */}
      <AgentMetrics stats={stats} />

      {/* Gráfico */}
      <AgentPerformanceChart data={chartData} />

      {/* Últimas conversas */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Últimas conversas</p>
        {recentConvs.length === 0
          ? <p className="text-sm text-slate-500 py-3 text-center">Nenhuma conversa encontrada.</p>
          : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {recentConvs.map(conv => {
                const cfg = STATUS_CFG[conv.status ?? ''] ?? STATUS_DEFAULT
                const label = cfg.label || conv.status || '—'
                return (
                  <div
                    key={conv.telefone}
                    onClick={() => navigate('/conversas')}
                    className="flex items-center justify-between bg-white/[0.03] border border-white/[0.05] rounded-lg px-3 py-2 hover:border-white/[0.10] cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-xs text-white">{conv.nome ?? conv.telefone}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{conv.telefone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] border px-1.5 py-0.5 rounded-full', cfg.cls)}>{label}</span>
                      <span className="text-[10px] text-slate-500">{conv.ultima_atividade ? formatRelativeTime(conv.ultima_atividade) : '—'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </div>

      {/* Ações */}
      <div className="flex gap-2 pt-1 border-t border-white/[0.05]">
        <button onClick={() => setEditOpen(true)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg px-3 py-1.5 transition-colors">
          <Edit2 className="h-3 w-3" /> Editar
        </button>
        <button onClick={() => {
          const next: AgentStatus = agent.status === 'active' ? 'maintenance' : agent.status === 'maintenance' ? 'active' : 'active'
          setNextStatus(next); setStatusOpen(true)
        }}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg px-3 py-1.5 transition-colors">
          <RefreshCw className="h-3 w-3" /> Alterar status
        </button>
        <button onClick={() => setDeleteOpen(true)}
          disabled={stats.open > 0}
          title={stats.open > 0 ? 'Reatribua as conversas abertas antes de excluir' : ''}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 bg-white/[0.04] hover:bg-red-500/10 border border-white/[0.06] rounded-lg px-3 py-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ml-auto">
          <Trash2 className="h-3 w-3" /> Excluir
        </button>
      </div>

      {/* Modal editar */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar agente">
        <AgentForm
          initial={{ id: agent.id, name: agent.name, department: agent.department, status: agent.status }}
          onSuccess={() => { setEditOpen(false); load(); onRefresh(); onToast('Agente atualizado!') }}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      {/* Confirm status */}
      <ConfirmDialog
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        onConfirm={handleStatusChange}
        title="Alterar status"
        description={`Deseja alterar o status de "${agent.name}" para "${nextStatus === 'active' ? 'Ativo' : nextStatus === 'inactive' ? 'Inativo' : 'Manutenção'}"?`}
        confirmLabel="Confirmar"
      />

      {/* Confirm delete */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Excluir agente"
        description={`Deseja excluir "${agent.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />
    </div>
  )
}
