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
  status: string
  department: string
  started_at: string
  telefone?: string
}

export interface RecentConversationsResponse {
  data: RecentConversation[]
  total: number
  page: number
  page_size: number
}

// ── Tipos SDR (WhatsApp) ────────────────────────────────────
export interface SdrContact {
  telefone: string
  nome: string
  ultima_mensagem: string | null
  message_count: number
}

export interface ChatMessage {
  id: number
  type: 'human' | 'ai'
  content: string
}

export interface N8nSession {
  session_id:       string
  nome:             string
  ultima_mensagem:  string | null
  status:           string | null
  followup:         boolean | null
  respondeu_FU:     boolean | null
  message_count:    number        // mensagens human + ai (sem tool)
  last_message_id:  number
  last_content:     string        // preview da última mensagem
  has_conv_record:  boolean
}

export interface ConversationsList {
  data:  N8nSession[]
  total: number
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

  // ── SDR / WhatsApp (fonte: n8n_chat_histories + conversations) ─

  /** Extrai o texto de um campo content do n8n (string | array de blocos) */
  _extractContent(raw: unknown): string {
    if (typeof raw === 'string') return raw
    if (Array.isArray(raw)) {
      return (raw as any[])
        .filter(c => c.type === 'text')
        .map(c => c.text ?? '')
        .join('')
    }
    return ''
  },

  /**
   * Carrega TODOS os registros de n8n_chat_histories e conversations,
   * agrupa por session_id e retorna uma lista de sessions com metadados.
   * Dados pequenos (72 msgs) — seguro fazer client-side.
   */
  async _getN8nSessions(): Promise<N8nSession[]> {
    const [{ data: histories }, { data: convRows }] = await Promise.all([
      supabase
        .from('n8n_chat_histories')
        .select('id, session_id, message')
        .order('id', { ascending: true }),
      supabase
        .from('conversations')
        .select('telefone, nome, ultima_mensagem, status, followup, respondeu_FU'),
    ])

    // Mapa telefone → registro de conversations
    const convByPhone = new Map<string, any>()
    for (const c of (convRows ?? [])) {
      convByPhone.set(c.telefone, c)
    }

    // Agrupa n8n_chat_histories por session_id
    const sessionMap = new Map<string, { rows: any[] }>()
    for (const row of (histories ?? [])) {
      if (!row.session_id) continue
      if (!sessionMap.has(row.session_id)) sessionMap.set(row.session_id, { rows: [] })
      sessionMap.get(row.session_id)!.rows.push(row)
    }

    const sessions: N8nSession[] = []
    for (const [sessionId, { rows }] of sessionMap) {
      const conv        = convByPhone.get(sessionId) ?? null
      const nonTool     = rows.filter(r => r.message?.type !== 'tool')
      const lastRow     = nonTool[nonTool.length - 1]
      const lastContent = lastRow ? this._extractContent(lastRow.message?.content) : ''
      const lastId      = Math.max(...rows.map(r => r.id as number))

      sessions.push({
        session_id:      sessionId,
        nome:            conv?.nome ?? sessionId,
        ultima_mensagem: conv?.ultima_mensagem ?? null,
        status:          conv?.status ?? null,
        followup:        conv?.followup ?? null,
        respondeu_FU:    conv?.respondeu_FU ?? null,
        message_count:   nonTool.length,
        last_message_id: lastId,
        last_content:    lastContent.slice(0, 120),
        has_conv_record: !!conv,
      })
    }

    // Mais recente primeiro (por id da última mensagem)
    sessions.sort((a, b) => b.last_message_id - a.last_message_id)
    return sessions
  },

  async getSdrKpis(): Promise<DashboardKpis> {
    const { start, end } = todayRange()
    const weekAgo    = daysAgoISO(7)
    const twoWeekAgo = daysAgoISO(14)

    const [sessions, agentRows] = await Promise.all([
      this._getN8nSessions(),
      supabase.from('agents').select('status').then(r => r.data ?? []),
    ])

    // Conversas hoje — sessions com ultima_mensagem = hoje
    const todayVal = sessions.filter(s =>
      s.ultima_mensagem && s.ultima_mensagem >= start && s.ultima_mensagem <= end
    ).length

    // Ontem
    const yestStart = new Date(new Date(start).getTime() - 86400000).toISOString()
    const yestVal   = sessions.filter(s =>
      s.ultima_mensagem && s.ultima_mensagem >= yestStart && s.ultima_mensagem < start
    ).length

    // Se não há datas disponíveis, cai para total de sessions
    const conversationsToday = todayVal > 0 || yestVal > 0
      ? todayVal
      : sessions.length

    const convChangePct = yestVal > 0
      ? Math.round(((todayVal - yestVal) / yestVal) * 1000) / 10
      : 0

    // Taxa de resolução (respondeu_FU / sessions com registro)
    const withConv   = sessions.filter(s => s.has_conv_record)
    const weekSess   = withConv.filter(s => s.ultima_mensagem && s.ultima_mensagem >= weekAgo)
    const weekRes    = weekSess.filter(s => s.respondeu_FU === true)
    const prevSess   = withConv.filter(s => s.ultima_mensagem && s.ultima_mensagem >= twoWeekAgo && s.ultima_mensagem < weekAgo)
    const prevRes    = prevSess.filter(s => s.respondeu_FU === true)

    const resRate    = weekSess.length > 0 ? Math.round((weekRes.length / weekSess.length) * 1000) / 10 : 0
    const prevRate   = prevSess.length > 0 ? Math.round((prevRes.length / prevSess.length) * 1000) / 10 : 0
    const resChange  = Math.round((resRate - prevRate) * 10) / 10

    // Tempo médio: data_transferencia → ultima_mensagem (de conversations)
    const { data: convRows } = await supabase
      .from('conversations')
      .select('data_transferencia, ultima_mensagem')
      .not('data_transferencia', 'is', null)
      .not('ultima_mensagem', 'is', null)
      .limit(200)

    let avgTime = 0
    if (convRows && convRows.length > 0) {
      const durs = convRows
        .map(c => Math.abs(new Date(c.ultima_mensagem).getTime() - new Date(c.data_transferencia).getTime()) / 1000)
        .filter(d => d > 0 && d < 86400)
      if (durs.length > 0) avgTime = Math.round(durs.reduce((a, b) => a + b, 0) / durs.length)
    }
    const avgTimeChange = avgTime > 0 ? Math.round(((300 - avgTime) / 300) * 1000) / 10 : 0

    return {
      conversations_today: { value: conversationsToday, change_pct: convChangePct },
      active_agents: {
        active:      (agentRows as any[]).filter(a => a.status === 'active').length,
        total:       (agentRows as any[]).length,
        maintenance: (agentRows as any[]).filter(a => a.status === 'maintenance').length,
      },
      resolution_rate:   { value: resRate,   change_pct: resChange },
      avg_response_time: { value: avgTime,   change_pct: avgTimeChange },
    }
  },

  async getSdrConversationsChart(): Promise<{ data: ConversationChartPoint[] }> {
    // Conta sessions com ultima_mensagem por dia (últimos 7 dias)
    // Para sessions sem data, distribui por id relativo (proxy)
    const sessions = await this._getN8nSessions()

    const result: ConversationChartPoint[] = []
    for (let i = 6; i >= 0; i--) {
      const date    = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const count = sessions.filter(s =>
        s.ultima_mensagem && s.ultima_mensagem.startsWith(dateStr)
      ).length

      result.push({ date: DAY_NAMES[date.getDay()], total: count })
    }

    // Se todos forem zero (sem datas) — coloca o total no dia mais recente
    const hasAny = result.some(r => r.total > 0)
    if (!hasAny && sessions.length > 0) {
      result[result.length - 1].total = sessions.length
    }

    return { data: result }
  },

  async getSdrStatusDistribution(): Promise<{ data: DepartmentResolution[] }> {
    const sessions = await this._getN8nSessions()

    if (sessions.length === 0) return { data: [] }

    const counts: Record<string, number> = {}
    for (const s of sessions) {
      const label = s.status ?? (s.has_conv_record ? 'sem status' : 'novo contato')
      counts[label] = (counts[label] ?? 0) + 1
    }

    const total = sessions.length
    const data = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([status, count]) => ({
        department:  status,
        value:       count,
        percentage:  Math.round((count / total) * 1000) / 10,
      }))

    return { data }
  },

  async getSdrRecentConversations(page = 1, pageSize = 10): Promise<RecentConversationsResponse> {
    const sessions = await this._getN8nSessions()

    const from  = (page - 1) * pageSize
    const paged = sessions.slice(from, from + pageSize)

    const rows: RecentConversation[] = paged.map(s => ({
      id:           s.session_id,
      contact_name: s.nome,
      agent_name:   s.session_id,
      status:       s.status ?? 'novo',
      department:   '',
      started_at:   s.ultima_mensagem ?? new Date().toISOString(),
      telefone:     s.session_id,
    }))

    return { data: rows, total: sessions.length, page, page_size: pageSize }
  },

  async getSdrContacts(
    page     = 1,
    pageSize = 10,
    search   = '',
    sort: 'nome' | 'recent' = 'recent',
  ): Promise<{ data: SdrContact[]; total: number }> {
    let sessions = await this._getN8nSessions()

    // Filtro de busca
    if (search.trim()) {
      const q = search.toLowerCase()
      sessions = sessions.filter(s =>
        s.nome.toLowerCase().includes(q) || s.session_id.includes(q)
      )
    }

    // Ordenação
    if (sort === 'nome') {
      sessions = [...sessions].sort((a, b) => a.nome.localeCompare(b.nome))
    }
    // sort === 'recent' já está ordenado por last_message_id DESC

    const total     = sessions.length
    const pageItems = sessions.slice((page - 1) * pageSize, page * pageSize)

    return {
      data: pageItems.map(s => ({
        telefone:        s.session_id,
        nome:            s.nome,
        ultima_mensagem: s.ultima_mensagem,
        message_count:   s.message_count,
      })),
      total,
    }
  },

  async getSdrConversationsList(
    page     = 1,
    pageSize = 15,
    search   = '',
    status   = '',
  ): Promise<ConversationsList> {
    let sessions = await this._getN8nSessions()

    if (search.trim()) {
      const q = search.toLowerCase()
      sessions = sessions.filter(s =>
        s.nome.toLowerCase().includes(q) || s.session_id.includes(q)
      )
    }

    if (status) {
      sessions = sessions.filter(s => (s.status ?? '') === status)
    }

    const total     = sessions.length
    const pageItems = sessions.slice((page - 1) * pageSize, page * pageSize)

    return { data: pageItems, total }
  },

  async getChatHistory(telefone: string): Promise<ChatMessage[]> {
    const { data } = await supabase
      .from('n8n_chat_histories')
      .select('id, message')
      .eq('session_id', telefone)
      .order('id', { ascending: true })
      .limit(300)

    return (data ?? [])
      .filter(r => r.message?.type !== 'tool')
      .map(r => {
        const content = this._extractContent(r.message?.content)
        return {
          id:      r.id as number,
          type:    (r.message?.type ?? 'ai') as 'human' | 'ai',
          content: content || '(mensagem vazia)',
        }
      })
  },

  async getSdrDistinctStatuses(): Promise<string[]> {
    const sessions = await this._getN8nSessions()
    const set = new Set<string>()
    for (const s of sessions) {
      if (s.status) set.add(s.status)
    }
    return Array.from(set).sort()
  },

  // ── Analytics (dados reais SDR) ─────────────────────────────

  _buildDateRange(filters: AnalyticsFilters): { start: string; end: string; days: number } {
    const now   = new Date()
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
    const allSessions = await this._getN8nSessions()

    // Filtra por periodo quando há data disponível; inclui sessions sem data apenas no total
    const sessionsWithDate    = allSessions.filter(s => s.ultima_mensagem)
    const sessionsInRange     = sessionsWithDate.filter(s =>
      s.ultima_mensagem! >= start && s.ultima_mensagem! <= end
    )
    // Sessions sem data são incluídas se não há filtro de período significativo
    const noDateSessions      = allSessions.filter(s => !s.ultima_mensagem)
    const rows                = filters.period === '90d' || filters.period === '30d'
      ? [...sessionsInRange, ...noDateSessions]
      : sessionsInRange

    const total    = rows.length || allSessions.length
    const resolved = rows.filter(s => s.respondeu_FU === true).length
    const resRate  = total > 0 ? Math.round((resolved / total) * 1000) / 10 : 0

    // Tempo médio: data_transferencia → ultima_mensagem
    const { data: convRows } = await supabase
      .from('conversations')
      .select('data_transferencia, ultima_mensagem')
      .not('data_transferencia', 'is', null)
      .not('ultima_mensagem', 'is', null)
    let avgTime = 0
    if (convRows && convRows.length > 0) {
      const durs = convRows
        .map(c => Math.abs(new Date(c.ultima_mensagem).getTime() - new Date(c.data_transferencia).getTime()) / 1000)
        .filter(d => d > 0 && d < 86400)
      if (durs.length > 0) avgTime = Math.round(durs.reduce((a, b) => a + b, 0) / durs.length)
    }

    // Total de mensagens como proxy de atividade
    const totalMsgs = allSessions.reduce((acc, s) => acc + s.message_count, 0)

    // Pico: session_id com mais mensagens
    const peakSession = allSessions.reduce((a, b) => a.message_count > b.message_count ? a : b, allSessions[0])

    return {
      total_conversations: allSessions.length,
      resolution_rate:     resRate,
      avg_response_time:   avgTime,
      avg_per_day:         days > 0 ? Math.round((totalMsgs / days) * 10) / 10 : 0,
      peak_day:            peakSession?.nome ?? '—',
      peak_count:          peakSession?.message_count ?? 0,
    }
  },

  async getVolumeChart(filters: AnalyticsFilters): Promise<VolumePoint[]> {
    const { start, days } = this._buildDateRange(filters)
    const startDate = new Date(start)

    // Conta MENSAGENS totais por dia (usando n8n_chat_histories com proxy de data por session)
    const allSessions = await this._getN8nSessions()

    const limit = Math.min(days, 30)
    const result: VolumePoint[] = []
    for (let i = limit - 1; i >= 0; i--) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + (days - 1 - i))
      const dateStr = d.toISOString().split('T')[0]

      // Sessions com ultima_mensagem neste dia
      const daySessions = allSessions.filter(s =>
        s.ultima_mensagem?.startsWith(dateStr)
      )
      result.push({
        date:     days <= 7 ? DAY_NAMES[d.getDay()] : dateStr.slice(5),
        total:    daySessions.length,
        resolved: daySessions.filter(s => s.respondeu_FU === true).length,
      })
    }

    // Se todos zerados (sem datas), coloca total no último dia
    const hasAny = result.some(r => r.total > 0)
    if (!hasAny) {
      result[result.length - 1].total = allSessions.length
    }

    return result
  },

  async getResolutionByDept(_filters: AnalyticsFilters): Promise<ResolutionByDept[]> {
    const allSessions = await this._getN8nSessions()

    // Distribui por status de follow-up
    const groups = [
      { label: 'Respondeu FU',   fn: (s: N8nSession) => s.respondeu_FU === true },
      { label: 'Não respondeu',  fn: (s: N8nSession) => s.followup === true && s.respondeu_FU !== true },
      { label: 'Sem follow-up',  fn: (s: N8nSession) => !s.followup && !s.respondeu_FU },
    ]

    return groups.map(g => {
      const gSessions = allSessions.filter(g.fn)
      const res       = gSessions.filter(s => s.respondeu_FU === true).length
      return {
        department: g.label,
        resolved:   res,
        total:      gSessions.length,
        rate:       gSessions.length > 0 ? Math.round((res / gSessions.length) * 1000) / 10 : 0,
      }
    }).filter(d => d.total > 0)
  },

  async getAgentRanking(filters: AnalyticsFilters): Promise<AgentRankingRow[]> {
    // Agentes continuam da tabela CRM
    const { start, end } = this._buildDateRange(filters)

    const { data } = await supabase
      .from('crm_conversations')
      .select('status, department, agent_id, started_at, ended_at, agents(name)')
      .gte('created_at', start)
      .lte('created_at', end)
    const rows = (data ?? []) as any[]

    const map: Record<string, { name: string; dept: string; rows: any[] }> = {}
    for (const r of rows) {
      if (!r.agent_id) continue
      if (!map[r.agent_id]) map[r.agent_id] = { name: r.agents?.name ?? 'Sem nome', dept: r.department, rows: [] }
      map[r.agent_id].rows.push(r)
    }

    const ranking: AgentRankingRow[] = Object.entries(map).map(([id, { name, dept, rows: ar }]) => {
      const res      = ar.filter(r => r.status === 'resolved')
      const withTime = res.filter(r => r.ended_at)
      let avgTime = 0
      if (withTime.length > 0) {
        const durs = withTime.map(r => (new Date(r.ended_at).getTime() - new Date(r.started_at).getTime()) / 1000)
        avgTime = Math.round(durs.reduce((a, b) => a + b, 0) / durs.length)
      }
      return {
        rank: 0, agent_id: id, agent_name: name, department: dept,
        total: ar.length, resolved: res.length,
        rate: ar.length > 0 ? Math.round((res.length / ar.length) * 1000) / 10 : 0,
        avg_time: avgTime,
      }
    })

    ranking.sort((a, b) => b.rate - a.rate || b.total - a.total)
    ranking.forEach((r, i) => { r.rank = i + 1 })
    return ranking
  },

  async getStatusDistribution(_filters: AnalyticsFilters): Promise<StatusDist[]> {
    const allSessions = await this._getN8nSessions()
    const total = allSessions.length
    const counts: Record<string, number> = {}
    for (const s of allSessions) {
      const label = s.status ?? (s.has_conv_record ? 'sem status' : 'novo contato')
      counts[label] = (counts[label] ?? 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({
        status,
        count,
        pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      }))
  },

  async getResponseTimeChart(filters: AnalyticsFilters): Promise<ResponseTimePoint[]> {
    const { days } = this._buildDateRange(filters)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (days - 1))

    const { data: convRows } = await supabase
      .from('conversations')
      .select('ultima_mensagem, data_transferencia')
      .not('data_transferencia', 'is', null)
      .not('ultima_mensagem', 'is', null)
    const rows = convRows ?? []

    const limit = Math.min(days, 30)
    const result: ResponseTimePoint[] = []
    for (let i = limit - 1; i >= 0; i--) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + (days - 1 - i))
      const dateStr = d.toISOString().split('T')[0]
      const dayRows = rows.filter(r => r.ultima_mensagem?.startsWith(dateStr))
      let avg = 0
      if (dayRows.length > 0) {
        const durs = dayRows
          .map(r => Math.abs(new Date(r.ultima_mensagem).getTime() - new Date(r.data_transferencia).getTime()) / 1000)
          .filter(d => d > 0 && d < 86400)
        if (durs.length > 0) avg = Math.round(durs.reduce((a, b) => a + b, 0) / durs.length)
      }
      result.push({ date: days <= 7 ? DAY_NAMES[d.getDay()] : dateStr.slice(5), avg_time: avg })
    }

    // Se tudo zero, mostra avg global
    const hasData = result.some(r => r.avg_time > 0)
    if (!hasData && rows.length > 0) {
      const allDurs = rows
        .map(r => Math.abs(new Date(r.ultima_mensagem).getTime() - new Date(r.data_transferencia).getTime()) / 1000)
        .filter(d => d > 0 && d < 86400)
      if (allDurs.length > 0) {
        const globalAvg = Math.round(allDurs.reduce((a, b) => a + b, 0) / allDurs.length)
        result[result.length - 1].avg_time = globalAvg
      }
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
    const { data: flow } = await supabase.from('flows').select('total_executions, successful_executions').eq('id', exec.flow_id).single()
    if (flow) {
      await supabase.from('flows').update({
        total_executions:      (flow.total_executions ?? 0) + 1,
        successful_executions: (flow.successful_executions ?? 0) + (exec.status === 'success' ? 1 : 0),
        last_executed_at:      new Date().toISOString(),
        updated_at:            new Date().toISOString(),
      }).eq('id', exec.flow_id)
    }
    return data as FlowExecution
  },
}
