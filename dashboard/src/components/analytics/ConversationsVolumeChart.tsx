import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { VolumePoint } from '@/lib/api'

interface Props {
  data: VolumePoint[]
  loading: boolean
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a2e] border border-white/[0.08] rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-bold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function ConversationsVolumeChart({ data, loading }: Props) {
  return (
    <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Volume de Conversas</h3>
        <p className="text-xs text-slate-500 mt-0.5">Total vs. Resolvidas no período</p>
      </div>

      {loading ? (
        <div className="h-52 bg-white/[0.02] rounded-xl animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="volTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="volResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>}
              iconType="circle"
              iconSize={8}
            />
            <Area
              type="monotone" dataKey="total" name="Total"
              stroke="#3b82f6" strokeWidth={2}
              fill="url(#volTotal)"
            />
            <Area
              type="monotone" dataKey="resolved" name="Resolvidas"
              stroke="#10b981" strokeWidth={2}
              fill="url(#volResolved)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
