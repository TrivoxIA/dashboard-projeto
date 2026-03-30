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
      const data = await api.getKpis()
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
      const { data } = await api.getConversationsChart()
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
      const { data } = await api.getResolutionByDepartment()
      setDonutData(data)
    } catch (e) {
      console.error('Erro ao carregar gráfico de departamentos', e)
    } finally {
      setDonutLoading(false)
    }
  }, [])

  const loadConversations = useCallback(async (page: number) => {
    setConvLoading(true)
    try {
      const result = await api.getRecentConversations(page)
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

  // Carregamento inicial
  useEffect(() => {
    loadKpis()
    loadChart()
    loadDonut()
  }, [loadKpis, loadChart, loadDonut])

  useEffect(() => {
    loadConversations(convPage)
  }, [loadConversations, convPage])

  const formatTime = (value: number) => {
    if (value < 10) return `${value.toFixed(1)}s`
    if (value < 60) return `${Math.round(value)}s`
    return `${Math.floor(value / 60)}m ${Math.round(value % 60)}s`
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-[1400px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Dashboard</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Atualizado às {lastRefreshed.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] rounded-lg px-3 py-1.5 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Conversas Hoje"
            value={kpis ? String(kpis.conversations_today.value) : '—'}
            change={kpis?.conversations_today.change_pct}
            subtitle="vs. ontem"
            icon={MessageSquare}
            loading={kpisLoading}
          />
          <KpiCard
            title="Agentes Ativos"
            value={kpis ? `${kpis.active_agents.active} / ${kpis.active_agents.total}` : '—'}
            subtitle={kpis ? `${kpis.active_agents.maintenance} em manutenção` : undefined}
            icon={Users}
            loading={kpisLoading}
            href="/agentes"
          />
          <KpiCard
            title="Taxa de Resolução"
            value={kpis ? `${kpis.resolution_rate.value}%` : '—'}
            change={kpis?.resolution_rate.change_pct}
            subtitle="vs. semana passada"
            icon={CheckCircle2}
            loading={kpisLoading}
          />
          <KpiCard
            title="Tempo Médio de Resposta"
            value={kpis ? formatTime(kpis.avg_response_time.value) : '—'}
            change={kpis?.avg_response_time.change_pct}
            subtitle="vs. média histórica"
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
            <DonutChart data={donutData} loading={donutLoading} />
          </div>
        </div>

        {/* Tabela */}
        <RecentConversations
          data={conversations}
          total={convTotal}
          page={convPage}
          pageSize={10}
          onPageChange={setConvPage}
          loading={convLoading}
        />
      </div>
    </AppLayout>
  )
}
