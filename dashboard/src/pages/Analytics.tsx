import { useEffect, useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import AnalyticsFiltersBar from '@/components/analytics/AnalyticsFilters'
import AnalyticsMetrics from '@/components/analytics/AnalyticsMetrics'
import ConversationsVolumeChart from '@/components/analytics/ConversationsVolumeChart'
import ResolutionByDeptChart from '@/components/analytics/ResolutionByDeptChart'
import StatusDistributionChart from '@/components/analytics/StatusDistributionChart'
import ResponseTimeChart from '@/components/analytics/ResponseTimeChart'
import AgentRankingTable from '@/components/analytics/AgentRankingTable'
import ExportButtons from '@/components/analytics/ExportButtons'
import { api } from '@/lib/api'
import type {
  AnalyticsFilters,
  AnalyticsSummary,
  VolumePoint,
  ResolutionByDept,
  AgentRankingRow,
  StatusDist,
  ResponseTimePoint,
} from '@/lib/api'

const DEFAULT_FILTERS: AnalyticsFilters = { period: '30d' }

export default function Analytics() {
  const [filters, setFilters] = useState<AnalyticsFilters>(DEFAULT_FILTERS)

  const [summary,    setSummary]    = useState<AnalyticsSummary | null>(null)
  const [volume,     setVolume]     = useState<VolumePoint[]>([])
  const [byDept,     setByDept]     = useState<ResolutionByDept[]>([])
  const [ranking,    setRanking]    = useState<AgentRankingRow[]>([])
  const [statusDist, setStatusDist] = useState<StatusDist[]>([])
  const [rtChart,    setRtChart]    = useState<ResponseTimePoint[]>([])

  const [loadingSum,    setLoadingSum]    = useState(true)
  const [loadingVol,    setLoadingVol]    = useState(true)
  const [loadingDept,   setLoadingDept]   = useState(true)
  const [loadingRank,   setLoadingRank]   = useState(true)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [loadingRt,     setLoadingRt]     = useState(true)

  const loadAll = useCallback(async (f: AnalyticsFilters) => {
    // Validate custom period
    if (f.period === 'custom' && (!f.startDate || !f.endDate)) return

    setLoadingSum(true); setLoadingVol(true); setLoadingDept(true)
    setLoadingRank(true); setLoadingStatus(true); setLoadingRt(true)

    await Promise.allSettled([
      api.getAnalyticsSummary(f).then(d => { setSummary(d); setLoadingSum(false) }),
      api.getVolumeChart(f).then(d => { setVolume(d); setLoadingVol(false) }),
      api.getResolutionByDept(f).then(d => { setByDept(d); setLoadingDept(false) }),
      api.getAgentRanking(f).then(d => { setRanking(d); setLoadingRank(false) }),
      api.getStatusDistribution(f).then(d => { setStatusDist(d); setLoadingStatus(false) }),
      api.getResponseTimeChart(f).then(d => { setRtChart(d); setLoadingRt(false) }),
    ])
  }, [])

  useEffect(() => { loadAll(filters) }, [loadAll, filters])

  function handleFiltersChange(f: AnalyticsFilters) {
    setFilters(f)
  }

  const anyLoading = loadingSum || loadingVol

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-[1400px]">
        {/* Header — V0 style */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-zinc-400">Métricas detalhadas do desempenho dos seus agentes</p>
          </div>

          <div className="flex items-center gap-3">
            <ExportButtons
              data={{ summary, volume, byDept, ranking }}
              loading={anyLoading}
            />
            <button
              onClick={() => loadAll(filters)}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 rounded-lg px-3 py-2 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Filters */}
        <AnalyticsFiltersBar filters={filters} onChange={handleFiltersChange} />

        {/* Metrics summary */}
        <AnalyticsMetrics data={summary} loading={loadingSum} />

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <ConversationsVolumeChart data={volume} loading={loadingVol} />
          </div>
          <div className="lg:col-span-2">
            <StatusDistributionChart data={statusDist} loading={loadingStatus} />
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <ResolutionByDeptChart data={byDept} loading={loadingDept} />
          </div>
          <div className="lg:col-span-2">
            <ResponseTimeChart data={rtChart} loading={loadingRt} />
          </div>
        </div>

        {/* Agent ranking */}
        <AgentRankingTable data={ranking} loading={loadingRank} />
      </div>
    </AppLayout>
  )
}
