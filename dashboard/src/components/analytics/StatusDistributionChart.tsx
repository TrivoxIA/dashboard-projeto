import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { StatusDist } from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
  'Em atendimento': '#3b82f6',
  'Agendado':       '#10b981',
  'Transferido':    '#f59e0b',
  'Cancelado':      '#ef4444',
}

interface Props {
  data: StatusDist[]
  loading: boolean
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as StatusDist
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-medium)] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[var(--text-primary)] font-semibold">{d.status}</p>
      <p className="text-[var(--text-secondary)]">{d.count} conversas ({d.pct}%)</p>
    </div>
  )
}

export default function StatusDistributionChart({ data, loading }: Props) {
  const total = data.reduce((a, d) => a + d.count, 0)

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Distribuição por Status</h3>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Proporção de cada estado</p>
      </div>

      {loading ? (
        <div className="h-52 bg-[var(--bg-page)]/30 rounded-xl animate-pulse" />
      ) : (
        <div className="flex flex-col items-center">
          <div className="relative">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={data} cx="50%" cy="50%"
                  innerRadius={48} outerRadius={72}
                  dataKey="count" strokeWidth={0}
                >
                  {data.map(entry => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#64748b'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-xl font-bold text-[var(--text-primary)]">{total}</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">total</p>
            </div>
          </div>

          <div className="mt-3 w-full space-y-1.5">
            {data.map(d => (
              <div key={d.status} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[d.status] ?? '#64748b' }}
                  />
                  <span className="text-[var(--text-secondary)]">{d.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-tertiary)]">{d.count}</span>
                  <span className="text-[var(--text-primary)] font-semibold w-10 text-right">{d.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
