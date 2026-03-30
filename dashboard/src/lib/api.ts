import { supabase } from './supabase'

// ── Tipos exportados ────────────────────────────────────────
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
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', start)
      .lte('created_at', end)

    // Conversas ontem
    const { count: yestCount } = await supabase
      .from('conversations')
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

    const { count: weekTotal }    = await supabase.from('conversations').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo)
    const { count: weekResolved } = await supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('status', 'resolved').gte('created_at', weekAgo)
    const { count: prevTotal }    = await supabase.from('conversations').select('*', { count: 'exact', head: true }).gte('created_at', twoWeekAgo).lt('created_at', weekAgo)
    const { count: prevResolved } = await supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('status', 'resolved').gte('created_at', twoWeekAgo).lt('created_at', weekAgo)

    const resRate     = (weekTotal ?? 0) > 0 ? Math.round(((weekResolved ?? 0) / (weekTotal ?? 1)) * 1000) / 10 : 0
    const prevResRate = (prevTotal ?? 0) > 0 ? Math.round(((prevResolved ?? 0) / (prevTotal ?? 1)) * 1000) / 10 : 0
    const resChange   = Math.round((resRate - prevResRate) * 10) / 10

    // Tempo médio de resposta (conversas resolvidas com ended_at)
    const { data: resolvedConvs } = await supabase
      .from('conversations')
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
        .from('conversations')
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
        .from('conversations')
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

  async getRecentConversations(page = 1, pageSize = 10): Promise<RecentConversationsResponse> {
    const from = (page - 1) * pageSize
    const to   = from + pageSize - 1

    const { data, count } = await supabase
      .from('conversations')
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
}
