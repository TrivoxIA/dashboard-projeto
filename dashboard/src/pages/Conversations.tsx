import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import ConversationsTable, { type ConversationRow } from '@/components/conversations/ConversationsTable'
import ConversationFilters, { type ConvFilters } from '@/components/conversations/ConversationFilters'
import ConversationDetail from '@/components/conversations/ConversationDetail'
import Modal from '@/components/shared/Modal'
import Pagination from '@/components/shared/Pagination'
import { useToast, ToastContainer } from '@/components/shared/Toast'
import { MessageSquare, Clock, CheckCircle2, CircleDot } from 'lucide-react'

const PAGE_SIZE = 15

const EMPTY_FILTERS: ConvFilters = { search: '', status: '', department: '', dateFrom: '', dateTo: '' }

interface CounterCardProps { icon: React.ElementType; label: string; value: number; color: string }
function CounterCard({ icon: Icon, label, value, color }: CounterCardProps) {
  return (
    <div className="bg-[#27272a] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-3">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-lg font-bold text-white leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export default function Conversations() {
  const { toasts, show, remove } = useToast()
  const [data, setData] = useState<ConversationRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ConvFilters>(EMPTY_FILTERS)
  const [counts, setCounts] = useState({ open: 0, pending: 0, resolved: 0 })
  const [detailId, setDetailId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const from = (page - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let query = supabase
      .from('conversations')
      .select(`
        id, status, department, started_at, ended_at,
        contacts(name),
        agents(name)
      `, { count: 'exact' })
      .order('started_at', { ascending: false })

    if (filters.status)     query = query.eq('status', filters.status)
    if (filters.department) query = query.eq('department', filters.department)
    if (filters.dateFrom)   query = query.gte('started_at', filters.dateFrom)
    if (filters.dateTo)     query = query.lte('started_at', filters.dateTo + 'T23:59:59')
    if (filters.search.trim()) {
      // busca via join não é trivial no supabase-js, filtramos client-side abaixo
    }

    const { data: rows, count } = await query.range(from, to)
    let result: ConversationRow[] = (rows ?? []).map((r: any) => ({
      id:           r.id,
      status:       r.status,
      department:   r.department,
      started_at:   r.started_at,
      ended_at:     r.ended_at,
      contact_name: r.contacts?.name ?? 'Desconhecido',
      agent_name:   r.agents?.name   ?? 'Sem agente',
    }))

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase()
      result = result.filter(r =>
        r.contact_name.toLowerCase().includes(q) ||
        r.agent_name.toLowerCase().includes(q)
      )
    }

    setData(result)
    setTotal(count ?? 0)
    setLoading(false)
  }, [page, filters])

  // Contadores por status
  const loadCounts = useCallback(async () => {
    const statuses = ['open', 'pending', 'resolved'] as const
    const results = await Promise.all(
      statuses.map(s =>
        supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('status', s)
      )
    )
    setCounts({
      open:     results[0].count ?? 0,
      pending:  results[1].count ?? 0,
      resolved: results[2].count ?? 0,
    })
  }, [])

  useEffect(() => { setPage(1) }, [filters])
  useEffect(() => { load() }, [load])
  useEffect(() => { loadCounts() }, [loadCounts])

  function updateFilters(partial: Partial<ConvFilters>) {
    setFilters(prev => ({ ...prev, ...partial }))
  }

  return (
    <AppLayout>
      <ToastContainer toasts={toasts} onRemove={remove} />
      <div className="p-6 space-y-6 max-w-[1400px]">

        {/* Header — V0 style */}
        <div>
          <h1 className="text-2xl font-bold text-white">Conversas</h1>
          <p className="text-zinc-400">Gerencie e monitore todas as conversas do WhatsApp</p>
        </div>

        {/* Contadores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <CounterCard icon={MessageSquare} label="Total"     value={counts.open + counts.pending + counts.resolved} color="bg-zinc-700/50 text-zinc-400" />
          <CounterCard icon={CircleDot}     label="Abertas"   value={counts.open}     color="bg-cyan-500/20 text-cyan-400" />
          <CounterCard icon={Clock}         label="Pendentes" value={counts.pending}  color="bg-amber-500/20 text-amber-400" />
          <CounterCard icon={CheckCircle2}  label="Resolvidas"value={counts.resolved} color="bg-emerald-500/20 text-emerald-400" />
        </div>

        {/* Filtros */}
        <ConversationFilters filters={filters} onChange={updateFilters} agents={[]} />

        {/* Tabela */}
        <div className="bg-[#27272a] border border-zinc-700/50 rounded-xl overflow-hidden">
          <ConversationsTable data={data} loading={loading} onView={setDetailId} />
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      </div>

      {/* Modal detalhe */}
      <Modal
        open={!!detailId}
        onClose={() => { setDetailId(null); load(); loadCounts() }}
        title="Detalhes da conversa"
        size="xl"
      >
        {detailId && (
          <ConversationDetail
            conversationId={detailId}
            onToast={show}
          />
        )}
      </Modal>
    </AppLayout>
  )
}
