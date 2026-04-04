import { useEffect, useState, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import ConversationsTable from '@/components/conversations/ConversationsTable'
import type { ConversationListItem } from '@/lib/api'
import ConversationFilters, { type ConvFilters } from '@/components/conversations/ConversationFilters'
import Modal from '@/components/shared/Modal'
import Pagination from '@/components/shared/Pagination'
import { useToast, ToastContainer } from '@/components/shared/Toast'
import ChatView from '@/components/shared/ChatView'
import { api } from '@/lib/api'
import { MessageSquare, CheckCircle2, Users } from 'lucide-react'

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
  const { toasts, remove }        = useToast()
  const [data, setData]           = useState<ConversationListItem[]>([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [filters, setFilters]     = useState<ConvFilters>(EMPTY_FILTERS)
  const [totalSessions, setTotalSessions] = useState(0)
  const [totalMsgs, setTotalMsgs]         = useState(0)
  const [totalResolvidas, setTotalResolvidas] = useState(0)
  const [chatPhone, setChatPhone] = useState<string | null>(null)
  const [chatNome, setChatNome]   = useState<string>('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await api.getSdrConversationsList(page, PAGE_SIZE, filters.search, filters.status)
      setData(result.data)
      setTotal(result.total)
    } catch (e) {
      console.error('Erro ao carregar conversas', e)
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  const loadCounts = useCallback(async () => {
    try {
      const kpis = await api.getSdrKpis()
      setTotalSessions(kpis.total_conversas)
      setTotalMsgs(kpis.total_mensagens)
      setTotalResolvidas(kpis.resolvidas)
    } catch { /* silencioso */ }
  }, [])

  useEffect(() => { setPage(1) }, [filters])
  useEffect(() => { load() }, [load])
  useEffect(() => { loadCounts() }, [loadCounts])

  function updateFilters(partial: Partial<ConvFilters>) {
    setFilters(prev => ({ ...prev, ...partial }))
  }

  function handleOpenChat(telefone: string) {
    const item = data.find(r => r.telefone === telefone)
    setChatNome(item?.nome ?? telefone)
    setChatPhone(telefone)
  }

  return (
    <AppLayout>
      <ToastContainer toasts={toasts} onRemove={remove} />
      <div className="p-6 space-y-6 max-w-[1400px]">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Conversas</h1>
          <p className="text-zinc-400">Gerencie e monitore todas as conversas do WhatsApp</p>
        </div>

        {/* Contadores */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <CounterCard icon={MessageSquare} label="Total de conversas" value={totalSessions}   color="bg-zinc-700/50 text-zinc-400" />
          <CounterCard icon={Users}         label="Total de mensagens" value={totalMsgs}     color="bg-cyan-500/20 text-cyan-400" />
          <CounterCard icon={CheckCircle2}  label="Agendadas"        value={totalResolvidas} color="bg-emerald-500/20 text-emerald-400" />
        </div>

        {/* Filtros */}
        <ConversationFilters filters={filters} onChange={updateFilters} />

        {/* Tabela */}
        <div className="bg-[#27272a] border border-zinc-700/50 rounded-xl overflow-hidden">
          <ConversationsTable data={data} loading={loading} onView={handleOpenChat} />
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      </div>

      {/* Modal: Chat */}
      <Modal
        open={!!chatPhone}
        onClose={() => setChatPhone(null)}
        title={`Chat — ${chatNome}`}
        size="xl"
      >
        {chatPhone && (
          <ChatView telefone={chatPhone} nome={chatNome} />
        )}
      </Modal>
    </AppLayout>
  )
}
