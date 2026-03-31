import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { ResponseTimePoint } from '@/lib/api'

interface Props {
  data: ResponseTimePoint[]
  loading: boolean
}

function formatTime(s: number) {
  if (s <= 0) return '0s'
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m${s % 60}s`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#27272a] border border-white/[0.08] rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-white font-bold">{formatTime(payload[0]?.value ?? 0)}</p>
    </div>
  )
}

export default function ResponseTimeChart({ data, loading }: Props) {
  return (
    <div className="bg-[#27272a] border border-white/[0.06] rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Tempo de Resposta</h3>
        <p className="text-xs text-slate-500 mt-0.5">Tempo médio por dia (segundos)</p>
      </div>

      {loading ? (
        <div className="h-52 bg-white/[0.02] rounded-xl animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="rtGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${v}s`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone" dataKey="avg_time" name="Tempo médio"
              stroke="#f59e0b" strokeWidth={2}
              fill="url(#rtGrad)"
              dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
