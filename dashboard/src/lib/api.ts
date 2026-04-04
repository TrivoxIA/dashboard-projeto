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
  resolved_count: number
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

export interface DashboardKpis {
  total_conversas: number
  conversas_hoje: number
  total_mensagens: number
  mensagens_hoje: number
  tempo_medio_resposta_seg: number
  taxa_resolucao: number
  resolvidas: number
  active_agents: { active: number; total: number; maintenance: number }
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

export interface ConversationListItem {
  telefone: string
  nome: string
  status: string
  ultima_mensagem: string | null
  ultima_msg_texto: string | null
}

// ── Helpers de data ─────────────────────────────────────────
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

  async getSdrKpis(): Promise<DashboardKpis> {
    const [{ data: kpiRows }, { data: agentRows }] = await Promise.all([
      supabase.from('v_dashboard_kpis').select('*'),
      supabase.from('agents').select('status'),
    ])

    const kpi = kpiRows?.[0] ?? {}
    const agents = agentRows ?? []

    return {
      total_conversas:         kpi.total_conversas ?? 0,
      conversas_hoje:          kpi.conversas_hoje ?? 0,
      total_mensagens:         kpi.total_mensagens ?? 0,
      mensagens_hoje:          kpi.mensagens_hoje ?? 0,
      tempo_medio_resposta_seg: kpi.tempo_medio_resposta_seg ?? 0,
      taxa_resolucao:          kpi.taxa_resolucao ?? 0,
      resolvidas:              kpi.resolvidas ?? 0,
      active_agents: {
        active:      (agents as any[]).filter(a => a.status === 'active').length,
        total:       (agents as any[]).length,
        maintenance: (agents as any[]).filter(a => a.status === 'maintenance').length,
      },
    }
  },

  async getSdrConversationsChart(): Promise<{ data: ConversationChartPoint[] }> {
    const sevenDaysAgo = daysAgoISO(7).split('T')[0]
    const { data: rows } = await supabase
      .from('v_conversas_por_dia')
      .select('*')
      .gte('dia', sevenDaysAgo)
      .order('dia', { ascending: true })

    const result: ConversationChartPoint[] = (rows ?? []).map(r => ({
      date: DAY_NAMES[new Date(r.dia + 'T12:00:00').getDay()],
      total: r.conversas ?? 0,
    }))

    return { data: result }
  },

  async getSdrStatusDistribution(): Promise<{ data: DepartmentResolution[] }> {
    const { data: rows } = await supabase
      .from('v_distribuicao_status')
      .select('*')

    const items = rows ?? []
    const total = items.reduce((a, r) => a + (r.total ?? 0), 0)
    if (total === 0) return { data: [] }

    const data = items
      .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
      .map(r => ({
        department:  r.status ?? 'Desconhecido',
        value:       r.total ?? 0,
        percentage:  Math.round(((r.total ?? 0) / total) * 1000) / 10,
      }))

    return { data }
  },

  async getSdrRecentConversations(page = 1, pageSize = 10): Promise<RecentConversationsResponse> {
    const from = (page - 1) * pageSize

    const { data: rows, count } = await supabase
      .from('v_conversas_recentes')
      .select('*', { count: 'exact' })
      .order('ultima_atividade', { ascending: false })
      .range(from, from + pageSize - 1)

    const data: RecentConversation[] = (rows ?? []).map(r => ({
      id:           r.telefone,
      contact_name: r.nome ?? r.telefone,
      agent_name:   r.telefone,
      status:       r.status ?? 'novo',
      department:   '',
      started_at:   r.ultima_atividade ?? new Date().toISOString(),
      telefone:     r.telefone,
    }))

    return { data, total: count ?? 0, page, page_size: pageSize }
  },

  async getSdrContacts(
    page     = 1,
    pageSize = 10,
    search   = '',
    sort: 'nome' | 'recent' = 'recent',
  ): Promise<{ data: SdrContact[]; total: number }> {
    const from = (page - 1) * pageSize

    let q = supabase
      .from('v_contatos')
      .select('*', { count: 'exact' })

    if (search.trim()) {
      q = q.or(`nome.ilike.%${search}%,telefone.ilike.%${search}%`)
    }

    if (sort === 'nome') {
      q = q.order('nome', { ascending: true })
    } else {
      q = q.order('ultima_mensagem', { ascending: false, nullsFirst: false })
    }

    const { data: rows, count } = await q.range(from, from + pageSize - 1)

    return {
      data: (rows ?? []).map(r => ({
        telefone:        r.telefone,
        nome:            r.nome ?? r.telefone,
        ultima_mensagem: r.ultima_mensagem,
        message_count:   r.total_mensagens ?? 0,
      })),
      total: count ?? 0,
    }
  },

  async getSdrConversationsList(
    page     = 1,
    pageSize = 15,
    search   = '',
    status   = '',
  ): Promise<{ data: ConversationListItem[]; total: number }> {
    const from = (page - 1) * pageSize

    let q = supabase
      .from('v_conversas_recentes')
      .select('*', { count: 'exact' })
      .order('ultima_atividade', { ascending: false })

    if (search.trim()) {
      q = q.or(`nome.ilike.%${search}%,telefone.ilike.%${search}%`)
    }
    if (status) {
      q = q.eq('status', status)
    }

    const { data: rows, count } = await q.range(from, from + pageSize - 1)

    const data: ConversationListItem[] = (rows ?? []).map(r => ({
      telefone:        r.telefone,
      nome:            r.nome ?? r.telefone,
      status:          r.status ?? 'novo',
      ultima_mensagem: r.ultima_atividade ?? null,
      ultima_msg_texto: r.ultima_mensagem ?? null,
    }))

    return { data, total: count ?? 0 }
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
    const { data: rows } = await supabase
      .from('v_distribuicao_status')
      .select('status')
    return (rows ?? []).map(r => r.status).filter(Boolean).sort()
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
    const { days } = this._buildDateRange(filters)

    const [{ data: kpiRows }, { data: volumeRows }] = await Promise.all([
      supabase.from('v_dashboard_kpis').select('*'),
      supabase.from('v_conversas_por_dia').select('*').order('conversas', { ascending: false }).limit(1),
    ])

    const kpi = kpiRows?.[0] ?? {} as any
    const peakRow = volumeRows?.[0]

    const total     = kpi.total_conversas ?? 0
    const totalMsgs = kpi.total_mensagens ?? 0

    return {
      total_conversations: total,
      resolution_rate:     kpi.taxa_resolucao ?? 0,
      avg_response_time:   kpi.tempo_medio_resposta_seg ?? 0,
      avg_per_day:         days > 0 ? Math.round((totalMsgs / days) * 10) / 10 : 0,
      peak_day:            peakRow?.dia ?? '—',
      peak_count:          peakRow?.conversas ?? 0,
      resolved_count:      kpi.resolvidas ?? 0,
    }
  },

  async getVolumeChart(filters: AnalyticsFilters): Promise<VolumePoint[]> {
    const { start, days } = this._buildDateRange(filters)
    const startStr = new Date(start).toISOString().split('T')[0]

    const { data: rows } = await supabase
      .from('v_conversas_por_dia')
      .select('*')
      .gte('dia', startStr)
      .order('dia', { ascending: true })

    return (rows ?? []).map(r => {
      const d = new Date(r.dia + 'T12:00:00')
      return {
        date:     days <= 7 ? DAY_NAMES[d.getDay()] : (r.dia as string).slice(5),
        total:    r.conversas ?? 0,
        resolved: 0,
      }
    })
  },

  async getResolutionByDept(_filters: AnalyticsFilters): Promise<ResolutionByDept[]> {
    return []
  },

  async getAgentRanking(_filters: AnalyticsFilters): Promise<AgentRankingRow[]> {
    return []
  },

  async getStatusDistribution(_filters: AnalyticsFilters): Promise<StatusDist[]> {
    const { data: rows } = await supabase
      .from('v_distribuicao_status')
      .select('*')

    const items = rows ?? []
    const total = items.reduce((a, r) => a + (r.total ?? 0), 0)

    return items
      .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
      .map(r => ({
        status: r.status ?? 'Desconhecido',
        count:  r.total ?? 0,
        pct:    total > 0 ? Math.round(((r.total ?? 0) / total) * 1000) / 10 : 0,
      }))
  },

  async getResponseTimeChart(filters: AnalyticsFilters): Promise<ResponseTimePoint[]> {
    const { start, days } = this._buildDateRange(filters)
    const startStr = new Date(start).toISOString().split('T')[0]

    const { data: rows } = await supabase
      .from('v_conversas_por_dia')
      .select('*')
      .gte('dia', startStr)
      .order('dia', { ascending: true })

    return (rows ?? []).map(r => {
      const d = new Date(r.dia + 'T12:00:00')
      return {
        date:     days <= 7 ? DAY_NAMES[d.getDay()] : (r.dia as string).slice(5),
        avg_time: r.total_mensagens ?? 0,
      }
    })
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
