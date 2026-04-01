import { supabase } from './supabase'

// ── Tipos: Flows ─────────────────────────────────────────────
export type FlowStatus    = 'active' | 'inactive' | 'error'
export type FlowType      = 'webhook' | 'scheduled' | 'manual'
export type ExecStatus    = 'success' | 'error' | 'running'

export interface Flow {
  id: string
  name: string
  description: string | null
  type: FlowType
  status: FlowStatus
  webhook_url: string | null
  cron_expression: string | null
  field_mapping: Record<string, string>
  config: Record<string, unknown>
  total_executions: number
  successful_executions: number
  last_executed_at: string | null
  created_at: string
  updated_at: string
}

export interface FlowExecution {
  id: string
  flow_id: string
  status: ExecStatus
  duration_ms: number | null
  payload: Record<string, unknown> | null
  response: Record<string, unknown> | null
  error_message: string | null
  executed_at: string
}

export interface FlowsSummary {
  total: number
  active: number
  inactive: number
  error: number
  last_webhook_at: string | null
}

export type FlowInput = Pick<Flow, 'name' | 'description' | 'type' | 'status' | 'webhook_url' | 'cron_expression' | 'field_mapping' | 'config'>

// ── Tipos exportados ────────────────────────────────────────
export type AnalyticsPeriod = 'today' | '7d' | '30d' | '90d' | 'custom'

export interface AnalyticsFilters {
  period: AnalyticsPeriod
  startDate?: string
  endDate?: string
  departments?: string[]
  agentIds?: string[]
}

export interface AnalyticsSummary {
  total_conversations: number
  resolution_rate: number
  avg_response_time: number
  avg_per_day: number
  peak_day: string
  peak_count: number
}

export interface VolumePoint {
  date: string
  total: number
  resolved: number
}

export interface ResolutionByDept {
  department: string
  resolved: number
  total: number
  rate: number
}

export interface AgentRankingRow {
  rank: number
  agent_id: string
  agent_name: string
  department: string
  total: number
  resolved: number
  rate: number
  avg_time: number
}

export interface StatusDist {
  status: string
  count: number
  pct: number
}

export interface ResponseTimePoint {
  date: string
  avg_time: number
}

export interface Setting {
  key: string
  value: string | null
}

export interface KpiCard {
  value: number
  change_pct: number
}

export interface DashboardKpis {
  conversations_today: KpiCard
  active_agents: { active: number; total: number; maintenance: number }
  resolution_rate: KpiCard
  avg_response_time: KpiCard
}

export interface ConversationChartPoint {
  date: string
  total: number
}

export interface DepartmentResolution {
  department: string
  value: number
  percentage: number
}

export interface RecentConversation {
  id: string
  contact_name: string
  agent_name: string
  status: 'open' | 'resolved' | 'pending'
  department: string
  started_at: string
}

export interface RecentConversationsResponse {
  data: RecentConversation[]
  total: number
  page: number
  page_size: number
}

// ── Helpers de data ─────────────────────────────────────────
function todayRange() {
  const d = new Date()
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString()
  const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString()
  return { start, end }
}

function daysAgoISO(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// ── API ─────────────────────────────────────────────────────
export const api = {
  async getKpis(): Promise<DashboardKpis> {
    const { start, end } = todayRange()
    const yesterday = { start: daysAgoISO(1), end: start }

    // Conversas hoje
    const { count: todayCount } = await supabase
      .from('crm_conversations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', start)
      .lte('created_at', end)

    // Conversas ontem
    const { count: yestCount } = await supabase
      .from('crm_conversations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.start)
      .lt('created_at', yesterday.end)

    const todayVal = todayCount ?? 0
    const yestVal  = yestCount  ?? 0
    const convChangePct = yestVal > 0 ? Math.round(((todayVal - yestVal) / yestVal) * 1000) / 10 : 0

    // Agentes
    const { data: agentRows } = await supabase.from('agents').select('status')
    const agents = agentRows ?? []
    const activeAgents      = agents.filter(a => a.status === 'active').length
    const maintenanceAgents = agents.filter(a => a.status === 'maintenance').length

    // Taxa de resolução — semana atual
    const weekAgo    = daysAgoISO(7)
    const twoWeekAgo = daysAgoISO(14)

    const { count: weekTotal }    = await supabase.from('crm_conversations').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo)
    const { count: weekResolved } = await supabase.from('crm_conversations').select('*', { count: 'exact', head: true }).eq('status', 'resolved').gte('created_at', weekAgo)
    const { count: prevTotal }    = await supabase.from('crm_conversations').select('*', { count: 'exact', head: true }).gte('created_at', twoWeekAgo).lt('created_at', weekAgo)
    const { count: prevResolved } = await supabase.from('crm_conversations').select('*', { count: 'exact', head: true }).eq('status', 'resolved').gte('created_at', twoWeekAgo).lt('created_at', weekAgo)

    const resRate     = (weekTotal ?? 0) > 0 ? Math.round(((weekResolved ?? 0) / (weekTotal ?? 1)) * 1000) / 10 : 0
    const prevResRate = (prevTotal ?? 0) > 0 ? Math.round(((prevResolved ?? 0) / (prevTotal ?? 1)) * 1000) / 10 : 0
    const resChange   = Math.round((resRate - prevResRate) * 10) / 10

    // Tempo médio de resposta (conversas resolvidas com ended_at)
    const { data: resolvedConvs } = await supabase
      .from('crm_conversations')
      .select('started_at, ended_at')
      .eq('status', 'resolved')
      .not('ended_at', 'is', null)
      .gte('created_at', weekAgo)
      .limit(100)

    let avgTime = 0
    if (resolvedConvs && resolvedConvs.length > 0) {
      const durations = resolvedConvs.map(c => {
        const s = new Date(c.started_at).getTime()
        const e = new Date(c.ended_at).getTime()
        return (e - s) / 1000
      })
      avgTime = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    }
    // Baseline 5s; inverter sinal pois tempo MENOR é melhor (mostra verde quando caiu)
    const avgTimeChange = avgTime > 0 ? Math.round(((5 - avgTime) / 5) * 1000) / 10 : 0

    return {
      conversations_today: { value: todayVal, change_pct: convChangePct },
      active_agents: { active: activeAgents, total: agents.length, maintenance: maintenanceAgents },
      resolution_rate: { value: resRate, change_pct: resChange },
      avg_response_time: { value: avgTime, change_pct: avgTimeChange },
    }
  },

  async getConversationsChart(): Promise<{ data: ConversationChartPoint[] }> {
    const result: ConversationChartPoint[] = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr   = date.toISOString().split('T')[0]
      const dayLabel  = DAY_NAMES[date.getDay()]

      const { count } = await supabase
        .from('crm_conversations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${dateStr}T00:00:00`)
        .lte('created_at', `${dateStr}T23:59:59`)

      result.push({ date: dayLabel, total: count ?? 0 })
    }

    return { data: result }
  },

  async getResolutionByDepartment(): Promise<{ data: DepartmentResolution[] }> {
    const departments = ['Suporte Técnico', 'Vendas', 'Financeiro', 'RH', 'Outros']
    const weekAgo = daysAgoISO(7)

    const counts: Record<string, number> = {}
    let total = 0

    for (const dept of departments) {
      const { count } = await supabase
        .from('crm_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved')
        .eq('department', dept)
        .gte('created_at', weekAgo)

      counts[dept] = count ?? 0
      total += counts[dept]
    }

    const data = departments.map(dept => ({
      department: dept,
      value: counts[dept],
      percentage: total > 0 ? Math.round((counts[dept] / total) * 1000) / 10 : 0,
    }))

    return { data }
  },

  // ── Analytics ──────────────────────────────────────────────
  _buildDateRange(filters: AnalyticsFilters): { start: string; end: string; days: number } {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (filters.period === 'today') {
      return {
        start: today.toISOString(),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString(),
        days: 1,
      }
    }
    if (filters.period === 'custom' && filters.startDate && filters.endDate) {
      const s = new Date(filters.startDate)
      const e = new Date(filters.endDate)
      return {
        start: s.toISOString(),
        end: new Date(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59).toISOString(),
        days: Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1),
      }
    }
    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 }
    const days = daysMap[filters.period] ?? 7
    const start = new Date(today)
    start.setDate(start.getDate() - (days - 1))
    return { start: start.toISOString(), end: now.toISOString(), days }
  },

  async getAnalyticsSummary(filters: AnalyticsFilters): Promise<AnalyticsSummary> {
    const { start, end, days } = this._buildDateRange(filters)

    let q = supabase.from('crm_conversations').select('id, status, started_at, ended_at, department, agent_id')
      .gte('created_at', start).lte('created_at', end)
    if (filters.departments?.length) q = q.in('department', filters.departments)
    if (filters.agentIds?.length) q = q.in('agent_id', filters.agentIds)

    const { data } = await q
    const rows = data ?? []
    const total = rows.length
    const resolved = rows.filter(r => r.status === 'resolved').length
    const resRate = total > 0 ? Math.round((resolved / total) * 1000) / 10 : 0

    const resolvedWithTime = rows.filter(r => r.status === 'resolved' && r.ended_at)
    let avgTime = 0
    if (resolvedWithTime.length > 0) {
      const durs = resolvedWithTime.map(r => (new Date(r.ended_at).getTime() - new Date(r.started_at).getTime()) / 1000)
      avgTime = Math.round(durs.reduce((a, b) => a + b, 0) / durs.length)
    }

    // Group by date to find peak
    const byDay: Record<string, number> = {}
    for (const r of rows) {
      const d = r.started_at.split('T')[0]
      byDay[d] = (byDay[d] ?? 0) + 1
    }
    let peakDay = '—'
    let peakCount = 0
    for (const [d, c] of Object.entries(byDay)) {
      if (c > peakCount) { peakCount = c; peakDay = d }
    }

    return {
      total_conversations: total,
      resolution_rate: resRate,
      avg_response_time: avgTime,
      avg_per_day: days > 0 ? Math.round((total / days) * 10) / 10 : 0,
      peak_day: peakDay,
      peak_count: peakCount,
    }
  },

  async getVolumeChart(filters: AnalyticsFilters): Promise<VolumePoint[]> {
    const { start, end, days } = this._buildDateRange(filters)
    const startDate = new Date(start)

    let q = supabase.from('crm_conversations').select('started_at, status, department, agent_id')
      .gte('created_at', start).lte('created_at', end)
    if (filters.departments?.length) q = q.in('department', filters.departments)
    if (filters.agentIds?.length) q = q.in('agent_id', filters.agentIds)
    const { data } = await q
    const rows = data ?? []

    const limit = Math.min(days, 30)
    const result: VolumePoint[] = []
    for (let i = limit - 1; i >= 0; i--) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + (days - 1 - i))
      const dateStr = d.toISOString().split('T')[0]
      const label = days === 1 ? `${d.getHours()}h` : DAY_NAMES[d.getDay()]

      const dayRows = rows.filter(r => r.started_at?.startsWith(dateStr))
      result.push({
        date: days <= 7 ? label : dateStr.slice(5),
        total: dayRows.length,
        resolved: dayRows.filter(r => r.status === 'resolved').length,
      })
    }
    return result
  },

  async getResolutionByDept(filters: AnalyticsFilters): Promise<ResolutionByDept[]> {
    const { start, end } = this._buildDateRange(filters)
    const departments = ['Suporte Técnico', 'Vendas', 'Financeiro', 'RH', 'Outros']

    let q = supabase.from('crm_conversations').select('status, department, agent_id')
      .gte('created_at', start).lte('created_at', end)
    if (filters.departments?.length) q = q.in('department', filters.departments)
    if (filters.agentIds?.length) q = q.in('agent_id', filters.agentIds)
    const { data } = await q
    const rows = data ?? []

    return departments.map(dept => {
      const deptRows = rows.filter(r => r.department === dept)
      const res = deptRows.filter(r => r.status === 'resolved').length
      return {
        department: dept,
        resolved: res,
        total: deptRows.length,
        rate: deptRows.length > 0 ? Math.round((res / deptRows.length) * 1000) / 10 : 0,
      }
    }).filter(d => d.total > 0)
  },

  async getAgentRanking(filters: AnalyticsFilters): Promise<AgentRankingRow[]> {
    const { start, end } = this._buildDateRange(filters)

    let q = supabase.from('crm_conversations')
      .select('status, department, agent_id, started_at, ended_at, agents(name)')
      .gte('created_at', start).lte('created_at', end)
    if (filters.departments?.length) q = q.in('department', filters.departments)
    if (filters.agentIds?.length) q = q.in('agent_id', filters.agentIds)
    const { data } = await q
    const rows = (data ?? []) as any[]

    const map: Record<string, { name: string; dept: string; rows: any[] }> = {}
    for (const r of rows) {
      if (!r.agent_id) continue
      if (!map[r.agent_id]) map[r.agent_id] = { name: r.agents?.name ?? 'Sem nome', dept: r.department, rows: [] }
      map[r.agent_id].rows.push(r)
    }

    const ranking: AgentRankingRow[] = Object.entries(map).map(([id, { name, dept, rows: ar }]) => {
      const res = ar.filter(r => r.status === 'resolved')
      const withTime = res.filter(r => r.ended_at)
      let avgTime = 0
      if (withTime.length > 0) {
        const durs = withTime.map(r => (new Date(r.ended_at).getTime() - new Date(r.started_at).getTime()) / 1000)
        avgTime = Math.round(durs.reduce((a, b) => a + b, 0) / durs.length)
      }
      return {
        rank: 0,
        agent_id: id,
        agent_name: name,
        department: dept,
        total: ar.length,
        resolved: res.length,
        rate: ar.length > 0 ? Math.round((res.length / ar.length) * 1000) / 10 : 0,
        avg_time: avgTime,
      }
    })

    ranking.sort((a, b) => b.rate - a.rate || b.total - a.total)
    ranking.forEach((r, i) => { r.rank = i + 1 })
    return ranking
  },

  async getStatusDistribution(filters: AnalyticsFilters): Promise<StatusDist[]> {
    const { start, end } = this._buildDateRange(filters)

    let q = supabase.from('crm_conversations').select('status, department, agent_id')
      .gte('created_at', start).lte('created_at', end)
    if (filters.departments?.length) q = q.in('department', filters.departments)
    if (filters.agentIds?.length) q = q.in('agent_id', filters.agentIds)
    const { data } = await q
    const rows = data ?? []
    const total = rows.length

    const counts: Record<string, number> = { open: 0, pending: 0, resolved: 0 }
    for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1

    return [
      { status: 'Resolvido', count: counts.resolved, pct: total > 0 ? Math.round((counts.resolved / total) * 1000) / 10 : 0 },
      { status: 'Aberto',    count: counts.open,     pct: total > 0 ? Math.round((counts.open     / total) * 1000) / 10 : 0 },
      { status: 'Pendente',  count: counts.pending,  pct: total > 0 ? Math.round((counts.pending  / total) * 1000) / 10 : 0 },
    ]
  },

  async getResponseTimeChart(filters: AnalyticsFilters): Promise<ResponseTimePoint[]> {
    const { start, end, days } = this._buildDateRange(filters)
    const startDate = new Date(start)

    let q = supabase.from('crm_conversations').select('started_at, ended_at, status, department, agent_id')
      .eq('status', 'resolved').not('ended_at', 'is', null)
      .gte('created_at', start).lte('created_at', end)
    if (filters.departments?.length) q = q.in('department', filters.departments)
    if (filters.agentIds?.length) q = q.in('agent_id', filters.agentIds)
    const { data } = await q
    const rows = data ?? []

    const limit = Math.min(days, 30)
    const result: ResponseTimePoint[] = []
    for (let i = limit - 1; i >= 0; i--) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + (days - 1 - i))
      const dateStr = d.toISOString().split('T')[0]
      const dayRows = rows.filter(r => r.started_at?.startsWith(dateStr))
      let avg = 0
      if (dayRows.length > 0) {
        const durs = dayRows.map(r => (new Date(r.ended_at).getTime() - new Date(r.started_at).getTime()) / 1000)
        avg = Math.round(durs.reduce((a, b) => a + b, 0) / durs.length)
      }
      result.push({ date: days <= 7 ? DAY_NAMES[d.getDay()] : dateStr.slice(5), avg_time: avg })
    }
    return result
  },

  // ── Settings ────────────────────────────────────────────────
  async getSettings(): Promise<Record<string, string>> {
    const { data } = await supabase.from('settings').select('key, value')
    const map: Record<string, string> = {}
    for (const row of (data ?? [])) map[row.key] = row.value ?? ''
    return map
  },

  async upsertSetting(key: string, value: string): Promise<void> {
    await supabase.from('settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  },

  async getRecentConversations(page = 1, pageSize = 10): Promise<RecentConversationsResponse> {
    const from = (page - 1) * pageSize
    const to   = from + pageSize - 1

    const { data, count } = await supabase
      .from('crm_conversations')
      .select(`
        id, status, department, started_at,
        contacts ( name ),
        agents   ( name )
      `, { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(from, to)

    const rows: RecentConversation[] = (data ?? []).map((r: any) => ({
      id:           r.id,
      contact_name: r.contacts?.name  ?? 'Desconhecido',
      agent_name:   r.agents?.name    ?? 'Sem agente',
      status:       r.status,
      department:   r.department,
      started_at:   r.started_at,
    }))

    return { data: rows, total: count ?? 0, page, page_size: pageSize }
  },

  // ── Flows ────────────────────────────────────────────────────
  async getFlowsSummary(): Promise<FlowsSummary> {
    const { data } = await supabase.from('flows').select('status, last_executed_at, type')
    const rows = data ?? []
    const webhookRows = rows.filter(r => r.type === 'webhook' && r.last_executed_at)
    const lastWebhook = webhookRows.sort((a, b) =>
      new Date(b.last_executed_at).getTime() - new Date(a.last_executed_at).getTime()
    )[0]?.last_executed_at ?? null
    return {
      total:    rows.length,
      active:   rows.filter(r => r.status === 'active').length,
      inactive: rows.filter(r => r.status === 'inactive').length,
      error:    rows.filter(r => r.status === 'error').length,
      last_webhook_at: lastWebhook,
    }
  },

  async getFlows(): Promise<Flow[]> {
    const { data } = await supabase.from('flows').select('*').order('created_at', { ascending: false })
    return (data ?? []) as Flow[]
  },

  async getFlowById(id: string): Promise<Flow | null> {
    const { data } = await supabase.from('flows').select('*').eq('id', id).single()
    return data as Flow | null
  },

  async createFlow(input: Partial<FlowInput>): Promise<Flow> {
    const { data, error } = await supabase.from('flows').insert([{ ...input, updated_at: new Date().toISOString() }]).select().single()
    if (error) throw error
    return data as Flow
  },

  async updateFlow(id: string, input: Partial<FlowInput>): Promise<void> {
    await supabase.from('flows').update({ ...input, updated_at: new Date().toISOString() }).eq('id', id)
  },

  async deleteFlow(id: string): Promise<void> {
    await supabase.from('flows').delete().eq('id', id)
  },

  async getFlowExecutions(flowId: string, opts?: { status?: ExecStatus | 'all'; limit?: number }): Promise<FlowExecution[]> {
    let q = supabase.from('flow_executions').select('*').eq('flow_id', flowId).order('executed_at', { ascending: false }).limit(opts?.limit ?? 50)
    if (opts?.status && opts.status !== 'all') q = q.eq('status', opts.status)
    const { data } = await q
    return (data ?? []) as FlowExecution[]
  },

  async addFlowExecution(exec: Omit<FlowExecution, 'id' | 'executed_at'>): Promise<FlowExecution> {
    const { data, error } = await supabase.from('flow_executions').insert([exec]).select().single()
    if (error) throw error
    // Update flow counters
    const { data: flow } = await supabase.from('flows').select('total_executions, successful_executions').eq('id', exec.flow_id).single()
    if (flow) {
      await supabase.from('flows').update({
        total_executions: (flow.total_executions ?? 0) + 1,
        successful_executions: (flow.successful_executions ?? 0) + (exec.status === 'success' ? 1 : 0),
        last_executed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', exec.flow_id)
    }
    return data as FlowExecution
  },
}
