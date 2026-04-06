import { useEffect, useState, useCallback } from 'react'
import { MessageSquare, Users, CheckCircle2, Clock, RefreshCw } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import KpiCard from '@/components/dashboard/KpiCard'
import ConversationsChart from '@/components/dashboard/ConversationsChart'
import DonutChart from '@/components/dashboard/DonutChart'
import RecentConversations from '@/components/dashboard/RecentConversations'
import { api } from '@/lib/api'
import type {
  DashboardKpis,
  ConversationChartPoint,
  DepartmentResolution,
  RecentConversation,
} from '@/lib/api'

export default function Dashboard() {
  // KPIs
  const [kpis, setKpis] = useState<DashboardKpis | null>(null)
  const [kpisLoading, setKpisLoading] = useState(true)

  // Chart
  const [chartData, setChartData] = useState<ConversationChartPoint[]>([])
  const [chartLoading, setChartLoading] = useState(true)

  // Donut
  const [donutData, setDonutData] = useState<DepartmentResolution[]>([])
  const [donutLoading, setDonutLoading] = useState(true)

  // Table
  const [conversations, setConversations] = useState<RecentConversation[]>([])
  const [convTotal, setConvTotal] = useState(0)
  const [convPage, setConvPage] = useState(1)
  const [convLoading, setConvLoading] = useState(true)

  const [lastRefreshed, setLastRefreshed] = useState(new Date())

  const loadKpis = useCallback(async () => {
    setKpisLoading(true)
    try {
      const data = await api.getSdrKpis()
      setKpis(data)
    } catch (e) {
      console.error('Erro ao carregar KPIs', e)
    } finally {
      setKpisLoading(false)
    }
  }, [])

  const loadChart = useCallback(async () => {
    setChartLoading(true)
    try {
      const { data } = await api.getSdrConversationsChart()
      setChartData(data)
    } catch (e) {
      console.error('Erro ao carregar gráfico', e)
    } finally {
      setChartLoading(false)
    }
  }, [])

  const loadDonut = useCallback(async () => {
    setDonutLoading(true)
    try {
      const { data } = await api.getSdrStatusDistribution()
      setDonutData(data)
    } catch (e) {
      console.error('Erro ao carregar gráfico de status', e)
    } finally {
      setDonutLoading(false)
    }
  }, [])

  const loadConversations = useCallback(async (page: number) => {
    setConvLoading(true)
    try {
      const result = await api.getSdrRecentConversations(page, 5)
      setConversations(result.data)
      setConvTotal(result.total)
    } catch (e) {
      console.error('Erro ao carregar conversas', e)
    } finally {
      setConvLoading(false)
    }
  }, [])

  const handleRefresh = useCallback(() => {
    loadKpis()
    loadChart()
    loadDonut()
    loadConversations(convPage)
    setLastRefreshed(new Date())
  }, [loadKpis, loadChart, loadDonut, loadConversations, convPage])

  useEffect(() => {
    loadKpis()
    loadChart()
    loadDonut()
  }, [loadKpis, loadChart, loadDonut])

  useEffect(() => {
    loadConversations(convPage)
  }, [loadConversations, convPage])

  const formatTime = (seg: number) => {
    if (seg <= 0) return '—'
    if (seg < 60) return `${Math.round(seg)}seg`
    const min = Math.floor(seg / 60)
    const s   = Math.round(seg % 60)
    if (min < 60) return `${min}min ${s}seg`
    return `${Math.floor(min / 60)}h ${min % 60}min`
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-[1400px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-zinc-400">
              Atualizado às {lastRefreshed.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 rounded-lg px-3 py-2 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Total Conversas"
            value={kpis ? String(kpis.total_conversas) : '—'}
            subtitle={kpis ? `${kpis.conversas_hoje} hoje` : undefined}
            icon={MessageSquare}
            loading={kpisLoading}
          />
          <KpiCard
            title="Conversas Hoje"
            value={kpis ? String(kpis.conversas_hoje) : '—'}
            subtitle={kpis ? `${kpis.mensagens_hoje} mensagens hoje` : undefined}
            icon={Users}
            loading={kpisLoading}
          />
          <KpiCard
            title="Taxa de Resolução"
            value={kpis ? `${kpis.taxa_resolucao}%` : '—'}
            subtitle={kpis ? `${kpis.resolvidas} agendadas` : undefined}
            icon={CheckCircle2}
            loading={kpisLoading}
          />
          <KpiCard
            title="Tempo Médio de Resposta"
            value={kpis ? formatTime(kpis.tempo_medio_resposta_seg) : '—'}
            subtitle="tempo médio entre mensagens"
            icon={Clock}
            loading={kpisLoading}
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <ConversationsChart data={chartData} loading={chartLoading} />
          </div>
          <div className="lg:col-span-2">
            <DonutChart
              data={donutData}
              loading={donutLoading}
              title="Distribuição por Status"
              subtitle="Todos os registros"
              valueLabel="conversas"
            />
          </div>
        </div>

        {/* Conversas Recentes */}
        <RecentConversations
          data={conversations}
          total={convTotal}
          page={convPage}
          pageSize={5}
          onPageChange={setConvPage}
          loading={convLoading}
        />
      </div>
    </AppLayout>
  )
}
