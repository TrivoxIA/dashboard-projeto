import { Trophy } from 'lucide-react'
import type { AgentRankingRow } from '@/lib/api'

const DEPT_COLOR: Record<string, string> = {
  'Suporte Técnico': '#10b981',
  'Vendas':          '#3b82f6',
  'Financeiro':      '#f59e0b',
  'RH':              '#8b5cf6',
  'Outros':          '#ef4444',
}

function formatTime(s: number) {
  if (s <= 0) return '—'
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-yellow-400 font-bold text-sm">🥇</span>
  if (rank === 2) return <span className="text-slate-300 font-bold text-sm">🥈</span>
  if (rank === 3) return <span className="text-amber-600 font-bold text-sm">🥉</span>
  return <span className="text-slate-500 text-sm font-medium w-5 text-center">{rank}</span>
}

interface Props {
  data: AgentRankingRow[]
  loading: boolean
}

function SkeletonRow() {
  return (
    <tr>
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 rounded bg-white/[0.05] animate-pulse" style={{ width: `${40 + i * 10}%` }} />
        </td>
      ))}
    </tr>
  )
}

export default function AgentRankingTable({ data, loading }: Props) {
  return (
    <div className="bg-[#13131f] border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
        <Trophy className="h-4 w-4 text-yellow-400" />
        <h3 className="text-sm font-semibold text-white">Ranking de Agentes</h3>
        <span className="text-xs text-slate-500 ml-1">por taxa de resolução</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="px-4 py-3 text-left text-slate-500 font-medium w-10">#</th>
              <th className="px-4 py-3 text-left text-slate-500 font-medium">Agente</th>
              <th className="px-4 py-3 text-left text-slate-500 font-medium">Departamento</th>
              <th className="px-4 py-3 text-right text-slate-500 font-medium">Conversas</th>
              <th className="px-4 py-3 text-right text-slate-500 font-medium">Resolvidas</th>
              <th className="px-4 py-3 text-right text-slate-500 font-medium">Taxa</th>
              <th className="px-4 py-3 text-right text-slate-500 font-medium">Tempo Médio</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
              : data.length === 0
              ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Nenhum agente com dados no período
                  </td>
                </tr>
              )
              : data.map(row => {
                const color = DEPT_COLOR[row.department] ?? '#64748b'
                const isTop3 = row.rank <= 3
                return (
                  <tr
                    key={row.agent_id}
                    className={`border-b border-white/[0.03] transition-colors ${
                      isTop3 ? 'bg-white/[0.015]' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="px-4 py-3 text-center">
                      <RankBadge rank={row.rank} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ backgroundColor: color + '20', color }}
                        >
                          {row.agent_name[0].toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{row.agent_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: color + '18', color }}
                      >
                        {row.department}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">{row.total}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{row.resolved}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${row.rate >= 80 ? 'text-emerald-400' : row.rate >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                        {row.rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">{formatTime(row.avg_time)}</td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
