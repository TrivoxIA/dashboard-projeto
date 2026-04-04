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
    <div className="bg-[#1f1f23] border border-white/[0.10] rounded-xl px-4 py-3 text-xs shadow-2xl">
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-bold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function ConversationsChart({ data, loading }: Props) {
  const maxVal = Math.max(...data.map(d => d.total), 1)
  const tickCount = maxVal <= 5 ? maxVal + 1 : 6

  return (
    <div className="bg-[#27272a] border border-white/[0.06] rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Conversas nos últimos 7 dias</h3>
        <p className="text-xs text-slate-500 mt-0.5">Total vs. Resolvidas por dia</p>
      </div>

      {loading ? (
        <div className="h-52 bg-white/[0.03] rounded-lg animate-pulse" />
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
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              domain={[0, 'auto']}
              tickCount={tickCount}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)' }} />
            <Legend
              formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>}
              iconType="circle"
              iconSize={8}
            />
            <Area
              type="monotone" dataKey="total" name="Total"
              stroke="#3B82F6" strokeWidth={2}
              fill="url(#dashTotal)"
              dot={{ fill: '#3B82F6', r: 4, strokeWidth: 2, stroke: '#27272a' }}
              activeDot={{ r: 5, fill: '#3B82F6', stroke: '#27272a', strokeWidth: 2 }}
            />
            <Area
              type="monotone" dataKey="resolved" name="Resolvidas"
              stroke="#22C55E" strokeWidth={2}
              fill="url(#dashResolved)"
              dot={{ fill: '#22C55E', r: 4, strokeWidth: 2, stroke: '#27272a' }}
              activeDot={{ r: 5, fill: '#22C55E', stroke: '#27272a', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
