import { useEffect, useState, useCallback } from 'react'
import { MessageSquare, Users, CheckCircle2, Clock, RefreshCw, GitBranch, XCircle, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
  FlowsSummary,
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

  // Flows summary
  const [flowsSummary, setFlowsSummary] = useState<FlowsSummary | null>(null)

  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const navigate = useNavigate()

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
    api.getFlowsSummary().then(setFlowsSummary).catch(() => {})
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
        {/* Header — V0 style */}
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

        {/* Status dos Fluxos */}
        <div
          onClick={() => navigate('/fluxos')}
          className="bg-[#27272a] border border-white/[0.06] rounded-xl p-5 cursor-pointer hover:border-white/[0.10] transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
                <GitBranch className="h-3.5 w-3.5 text-sky-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">Status dos Fluxos</h3>
            </div>
            <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors">
              Ver todos <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {flowsSummary ? (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-sm text-white font-medium">{flowsSummary.active}</span>
                <span className="text-xs text-slate-500">ativos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-500" />
                <span className="text-sm text-white font-medium">{flowsSummary.inactive}</span>
                <span className="text-xs text-slate-500">inativos</span>
              </div>
              {flowsSummary.error > 0 && (
                <div className="flex items-center gap-2">
                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-sm text-red-400 font-medium">{flowsSummary.error}</span>
                  <span className="text-xs text-slate-500">com erro</span>
                </div>
              )}
              {flowsSummary.last_webhook_at && (
                <div className="ml-auto text-xs text-slate-500">
                  Último webhook:{' '}
                  <span className="text-slate-300">
                    {(() => {
                      const diff = Date.now() - new Date(flowsSummary.last_webhook_at!).getTime()
                      const mins = Math.floor(diff / 60000)
                      if (mins < 1)  return 'agora'
                      if (mins < 60) return `há ${mins} min`
                      return `há ${Math.floor(mins / 60)}h`
                    })()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-6 w-48 bg-white/[0.05] rounded animate-pulse" />
          )}
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
