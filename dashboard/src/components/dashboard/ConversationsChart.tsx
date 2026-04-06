import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
} from 'recharts'
import type { ConversationChartPoint } from '@/lib/api'

interface Props {
  data: ConversationChartPoint[]
  loading?: boolean
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--bg-sidebar)] border border-[var(--border-strong)] rounded-xl px-4 py-3 text-xs shadow-2xl">
      <p className="text-[var(--text-secondary)] mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-[var(--text-secondary)]">{p.name}:</span>
          <span className="font-bold text-[var(--text-primary)]">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function ConversationsChart({ data, loading }: Props) {
  const maxVal = Math.max(...data.map(d => d.total), 1)
  const tickCount = maxVal <= 5 ? maxVal + 1 : 6

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Conversas nos últimos 7 dias</h3>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Total vs. Resolvidas por dia</p>
      </div>

      {loading ? (
        <div className="h-52 bg-[var(--bg-page)]/40 rounded-lg animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="dashTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="dashResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              domain={[0, 'auto']}
              tickCount={tickCount}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-default)' }} />
            <Legend
              formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{v}</span>}
              iconType="circle"
              iconSize={8}
            />
            <Area
              type="monotone" dataKey="total" name="Total"
              stroke="#3B82F6" strokeWidth={2}
              fill="url(#dashTotal)"
              dot={{ fill: '#3B82F6', r: 4, strokeWidth: 2, stroke: 'var(--bg-card)' }}
              activeDot={{ r: 5, fill: '#3B82F6', stroke: 'var(--bg-card)', strokeWidth: 2 }}
            />
            <Area
              type="monotone" dataKey="resolved" name="Resolvidas"
              stroke="#22C55E" strokeWidth={2}
              fill="url(#dashResolved)"
              dot={{ fill: '#22C55E', r: 4, strokeWidth: 2, stroke: 'var(--bg-card)' }}
              activeDot={{ r: 5, fill: '#22C55E', stroke: 'var(--bg-card)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
