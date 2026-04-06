import { Download, FileText } from 'lucide-react'
import type { AnalyticsSummary, VolumePoint, ResolutionByDept, AgentRankingRow } from '@/lib/api'

interface ExportData {
  summary: AnalyticsSummary | null
  volume: VolumePoint[]
  byDept: ResolutionByDept[]
  ranking: AgentRankingRow[]
}

function formatTime(s: number) {
  if (s <= 0) return '0s'
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m${s % 60}s`
}

function buildCsv(data: ExportData): string {
  const lines: string[] = []

  lines.push('## RESUMO')
  lines.push('Métrica,Valor')
  if (data.summary) {
    lines.push(`Total de Conversas,${data.summary.total_conversations}`)
    lines.push(`Taxa de Resolução,${data.summary.resolution_rate}%`)
    lines.push(`Tempo Médio,${formatTime(data.summary.avg_response_time)}`)
    lines.push(`Média por Dia,${data.summary.avg_per_day}`)
    lines.push(`Dia de Pico,${data.summary.peak_day} (${data.summary.peak_count})`)
  }

  lines.push('')
  lines.push('## VOLUME DE CONVERSAS')
  lines.push('Data,Total,Resolvidas')
  for (const v of data.volume) lines.push(`${v.date},${v.total},${v.resolved}`)

  lines.push('')
  lines.push('## RESOLUÇÃO POR DEPARTAMENTO')
  lines.push('Departamento,Total,Resolvidas,Taxa (%)')
  for (const d of data.byDept) lines.push(`${d.department},${d.total},${d.resolved},${d.rate}`)

  lines.push('')
  lines.push('## RANKING DE AGENTES')
  lines.push('Posição,Agente,Departamento,Total,Resolvidas,Taxa (%),Tempo Médio')
  for (const r of data.ranking) {
    lines.push(`${r.rank},${r.agent_name},${r.department},${r.total},${r.resolved},${r.rate},${formatTime(r.avg_time)}`)
  }

  return lines.join('\n')
}

interface Props {
  data: ExportData
  loading: boolean
}

export default function ExportButtons({ data, loading }: Props) {
  function handleCsv() {
    const csv = buildCsv(data)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handlePdf() {
    window.print()
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCsv}
        disabled={loading || !data.summary}
        className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-page)]/50 hover:bg-[var(--border-zinc)]/40 border border-[var(--border-default)] rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Download className="h-3.5 w-3.5" />
        CSV
      </button>
      <button
        onClick={handlePdf}
        disabled={loading || !data.summary}
        className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-page)]/50 hover:bg-[var(--border-zinc)]/40 border border-[var(--border-default)] rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <FileText className="h-3.5 w-3.5" />
        PDF
      </button>
    </div>
  )
}
