from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


# ── KPIs ────────────────────────────────────────────────────
class KpiCard(BaseModel):
    value: float
    change_pct: float          # variação percentual vs período anterior


class DashboardKpis(BaseModel):
    conversations_today: KpiCard
    active_agents: dict        # {active, total, maintenance}
    resolution_rate: KpiCard
    avg_response_time: KpiCard  # em segundos


# ── Gráfico de linha ─────────────────────────────────────────
class ConversationChartPoint(BaseModel):
    date: str                  # "Seg", "Ter", ...
    total: int


class ConversationsChartResponse(BaseModel):
    data: list[ConversationChartPoint]


# ── Gráfico de rosca ─────────────────────────────────────────
class DepartmentResolution(BaseModel):
    department: str
    value: int
    percentage: float


class ResolutionByDepartmentResponse(BaseModel):
    data: list[DepartmentResolution]


# ── Tabela de conversas recentes ─────────────────────────────
class RecentConversation(BaseModel):
    id: str
    contact_name: str
    agent_name: str
    status: str
    department: str
    started_at: datetime


class RecentConversationsResponse(BaseModel):
    data: list[RecentConversation]
    total: int
    page: int
    page_size: int
