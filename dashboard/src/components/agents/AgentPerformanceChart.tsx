import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { date: string; resolved: number }[]
  loading?: boolean
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-medium)] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <p className="text-sm font-semibold text-[var(--text-primary)]">{payload[0].value} resolvidas</p>
    </div>
  )
}

export default function AgentPerformanceChart({ data, loading }: Props) {
  return (
    <div className="bg-[var(--bg-page)]/30 border border-[var(--border-default)] rounded-xl p-4">
      <p className="text-xs font-semibold text-[var(--text-secondary)] mb-3">Conversas resolvidas — últimos 7 dias</p>
      {loading ? (
        <div className="h-36 bg-[var(--bg-page)]/40 rounded-lg animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height={144}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="agentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-default)' }} />
            <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} fill="url(#agentGrad)"
              dot={{ fill: '#10b981', r: 2.5, strokeWidth: 0 }}
              activeDot={{ r: 4, fill: '#10b981', stroke: 'var(--bg-page)', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
