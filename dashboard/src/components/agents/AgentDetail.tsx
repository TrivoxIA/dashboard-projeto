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

const STATUS_CFG = {
  resolved: { label: 'Resolvido', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  pending:  { label: 'Pendente',  cls: 'bg-amber-500/15  text-amber-400  border-amber-500/20'  },
  open:     { label: 'Aberto',    cls: 'bg-blue-500/15   text-blue-400   border-blue-500/20'   },
} as const

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface Agent {
  id: string; name: string; department: string; status: AgentStatus; created_at: string
}
interface Conversation {
  id: string; status: string; department: string; started_at: string; ended_at: string | null
  contacts: { name: string } | null
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
  const [recentConvs, setRecentConvs] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const [editOpen, setEditOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [nextStatus, setNextStatus] = useState<AgentStatus>('active')

  async function load() {
    setLoading(true)
    const [{ data: a }, { data: convs }] = await Promise.all([
      supabase.from('agents').select('*').eq('id', agentId).single(),
      supabase.from('conversations')
        .select('id, status, department, started_at, ended_at, contacts(name)')
        .eq('agent_id', agentId)
        .order('started_at', { ascending: false })
        .limit(50),
    ])

    setAgent(a as Agent)
    const all = (convs as any) ?? []
    setRecentConvs(all.slice(0, 10))

    const resolved  = all.filter((c: any) => c.status === 'resolved')
    const open      = all.filter((c: any) => c.status === 'open' || c.status === 'pending')
    const durations = resolved.filter((c: any) => c.ended_at).map((c: any) =>
      (new Date(c.ended_at).getTime() - new Date(c.started_at).getTime()) / 1000
    )
    const avgTime = durations.length > 0 ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length) : 0

    setStats({
      total:           all.length,
      resolved:        resolved.length,
      open:            open.length,
      resolutionRate:  all.length > 0 ? Math.round((resolved.length / all.length) * 100) : 0,
      avgResponseTime: avgTime,
    })

    // Gráfico últimos 7 dias
    const chart = []
    for (let i = 6; i >= 0; i--) {
      const d   = new Date(); d.setDate(d.getDate() - i)
      const ds  = d.toISOString().split('T')[0]
      const cnt = resolved.filter((c: any) => c.started_at?.startsWith(ds)).length
      chart.push({ date: DAY_NAMES[d.getDay()], resolved: cnt })
    }
    setChartData(chart)
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
                const cfg = STATUS_CFG[conv.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.open
                return (
                  <div
                    key={conv.id}
                    onClick={() => navigate('/conversas')}
                    className="flex items-center justify-between bg-white/[0.03] border border-white/[0.05] rounded-lg px-3 py-2 hover:border-white/[0.10] cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-xs text-white">{(conv.contacts as any)?.name ?? 'Desconhecido'}</p>
                      <p className="text-[10px] text-slate-500">{conv.department}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] border px-1.5 py-0.5 rounded-full', cfg.cls)}>{cfg.label}</span>
                      <span className="text-[10px] text-slate-500">{formatRelativeTime(conv.started_at)}</span>
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
