const BASE = '/api/dashboard'

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<T>
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

export const api = {
  getKpis: () => fetchJson<DashboardKpis>('/kpis'),
  getConversationsChart: () =>
    fetchJson<{ data: ConversationChartPoint[] }>('/conversations-chart'),
  getResolutionByDepartment: () =>
    fetchJson<{ data: DepartmentResolution[] }>('/resolution-by-department'),
  getRecentConversations: (page = 1, pageSize = 10) =>
    fetchJson<RecentConversationsResponse>(
      `/recent-conversations?page=${page}&page_size=${pageSize}`
    ),
}
