"""
Funções de query reutilizáveis para o dashboard.
"""
from datetime import date, timedelta, datetime, timezone
from app.database.supabase import get_supabase


def get_conversations_today() -> int:
    sb = get_supabase()
    today = date.today().isoformat()
    result = (
        sb.table("conversations")
        .select("id", count="exact")
        .gte("created_at", f"{today}T00:00:00")
        .lte("created_at", f"{today}T23:59:59")
        .execute()
    )
    return result.count or 0


def get_conversations_yesterday() -> int:
    sb = get_supabase()
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    result = (
        sb.table("conversations")
        .select("id", count="exact")
        .gte("created_at", f"{yesterday}T00:00:00")
        .lte("created_at", f"{yesterday}T23:59:59")
        .execute()
    )
    return result.count or 0


def get_agents_summary() -> dict:
    sb = get_supabase()
    result = sb.table("agents").select("status").execute()
    rows = result.data or []
    active = sum(1 for r in rows if r["status"] == "active")
    maintenance = sum(1 for r in rows if r["status"] == "maintenance")
    return {"active": active, "total": len(rows), "maintenance": maintenance}


def get_resolution_rate_this_week() -> float:
    sb = get_supabase()
    week_ago = (date.today() - timedelta(days=7)).isoformat()
    total = (
        sb.table("conversations")
        .select("id", count="exact")
        .gte("created_at", f"{week_ago}T00:00:00")
        .execute()
    )
    resolved = (
        sb.table("conversations")
        .select("id", count="exact")
        .eq("status", "resolved")
        .gte("created_at", f"{week_ago}T00:00:00")
        .execute()
    )
    t = total.count or 0
    r = resolved.count or 0
    return round((r / t * 100) if t > 0 else 0, 1)


def get_resolution_rate_prev_week() -> float:
    sb = get_supabase()
    two_weeks_ago = (date.today() - timedelta(days=14)).isoformat()
    one_week_ago = (date.today() - timedelta(days=7)).isoformat()
    total = (
        sb.table("conversations")
        .select("id", count="exact")
        .gte("created_at", f"{two_weeks_ago}T00:00:00")
        .lt("created_at", f"{one_week_ago}T00:00:00")
        .execute()
    )
    resolved = (
        sb.table("conversations")
        .select("id", count="exact")
        .eq("status", "resolved")
        .gte("created_at", f"{two_weeks_ago}T00:00:00")
        .lt("created_at", f"{one_week_ago}T00:00:00")
        .execute()
    )
    t = total.count or 0
    r = resolved.count or 0
    return round((r / t * 100) if t > 0 else 0, 1)


def get_avg_response_time_today() -> float:
    """Retorna tempo médio de resposta em segundos (conversas resolvidas hoje)."""
    sb = get_supabase()
    today = date.today().isoformat()
    result = (
        sb.table("conversations")
        .select("started_at, ended_at")
        .eq("status", "resolved")
        .gte("created_at", f"{today}T00:00:00")
        .not_.is_("ended_at", "null")
        .execute()
    )
    rows = result.data or []
    if not rows:
        return 0.0
    durations = []
    for r in rows:
        try:
            start = datetime.fromisoformat(r["started_at"].replace("Z", "+00:00"))
            end = datetime.fromisoformat(r["ended_at"].replace("Z", "+00:00"))
            durations.append((end - start).total_seconds())
        except Exception:
            pass
    return round(sum(durations) / len(durations), 1) if durations else 0.0


def get_conversations_last_7_days() -> list[dict]:
    sb = get_supabase()
    result = []
    day_names = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
    for i in range(6, -1, -1):
        d = date.today() - timedelta(days=i)
        count_result = (
            sb.table("conversations")
            .select("id", count="exact")
            .gte("created_at", f"{d.isoformat()}T00:00:00")
            .lte("created_at", f"{d.isoformat()}T23:59:59")
            .execute()
        )
        result.append({
            "date": day_names[d.weekday() + 1 if d.weekday() < 6 else 0],
            "total": count_result.count or 0,
        })
    return result


def get_resolutions_by_department() -> list[dict]:
    sb = get_supabase()
    week_ago = (date.today() - timedelta(days=7)).isoformat()
    departments = ["Suporte Técnico", "Vendas", "Financeiro", "RH", "Outros"]
    result = []
    total_resolved = 0

    counts = {}
    for dept in departments:
        r = (
            sb.table("conversations")
            .select("id", count="exact")
            .eq("status", "resolved")
            .eq("department", dept)
            .gte("created_at", f"{week_ago}T00:00:00")
            .execute()
        )
        counts[dept] = r.count or 0
        total_resolved += counts[dept]

    for dept in departments:
        pct = round((counts[dept] / total_resolved * 100) if total_resolved > 0 else 0, 1)
        result.append({"department": dept, "value": counts[dept], "percentage": pct})

    return result


def get_recent_conversations(page: int = 1, page_size: int = 10) -> dict:
    sb = get_supabase()
    offset = (page - 1) * page_size

    result = (
        sb.table("conversations")
        .select(
            "id, status, department, started_at, "
            "contacts(name), "
            "agents(name)"
        )
        .order("started_at", desc=True)
        .range(offset, offset + page_size - 1)
        .execute()
    )

    total_result = (
        sb.table("conversations")
        .select("id", count="exact")
        .execute()
    )

    rows = []
    for r in (result.data or []):
        rows.append({
            "id": r["id"],
            "contact_name": (r.get("contacts") or {}).get("name", "Desconhecido"),
            "agent_name": (r.get("agents") or {}).get("name", "Sem agente"),
            "status": r["status"],
            "department": r["department"],
            "started_at": r["started_at"],
        })

    return {
        "data": rows,
        "total": total_result.count or 0,
        "page": page,
        "page_size": page_size,
    }
