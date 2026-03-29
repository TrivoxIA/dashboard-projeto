import logging
from fastapi import APIRouter, Query

from app.database import queries
from app.database.models import (
    DashboardKpis,
    KpiCard,
    ConversationsChartResponse,
    ResolutionByDepartmentResponse,
    RecentConversationsResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/kpis", response_model=DashboardKpis)
async def get_kpis():
    """Retorna os 4 KPIs da dashboard principal."""
    today_count = queries.get_conversations_today()
    yesterday_count = queries.get_conversations_yesterday()
    change_conv = (
        round((today_count - yesterday_count) / yesterday_count * 100, 1)
        if yesterday_count > 0 else 0.0
    )

    agents = queries.get_agents_summary()

    resolution_this = queries.get_resolution_rate_this_week()
    resolution_prev = queries.get_resolution_rate_prev_week()
    change_res = round(resolution_this - resolution_prev, 1)

    avg_time = queries.get_avg_response_time_today()
    # Comparar com média histórica de 45 segundos (placeholder)
    avg_time_change = round(((avg_time - 45) / 45 * 100) if avg_time > 0 else 0.0, 1)

    return DashboardKpis(
        conversations_today=KpiCard(value=today_count, change_pct=change_conv),
        active_agents=agents,
        resolution_rate=KpiCard(value=resolution_this, change_pct=change_res),
        avg_response_time=KpiCard(value=avg_time, change_pct=avg_time_change),
    )


@router.get("/conversations-chart", response_model=ConversationsChartResponse)
async def get_conversations_chart():
    """Dados do gráfico de linha — conversas nos últimos 7 dias."""
    data = queries.get_conversations_last_7_days()
    return ConversationsChartResponse(data=data)


@router.get("/resolution-by-department", response_model=ResolutionByDepartmentResponse)
async def get_resolution_by_department():
    """Dados do gráfico de rosca — resolução por departamento."""
    data = queries.get_resolutions_by_department()
    return ResolutionByDepartmentResponse(data=data)


@router.get("/recent-conversations", response_model=RecentConversationsResponse)
async def get_recent_conversations(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
):
    """Lista paginada de conversas recentes."""
    result = queries.get_recent_conversations(page=page, page_size=page_size)
    return RecentConversationsResponse(**result)
