import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { ResolutionByDept } from '@/lib/api'

const COLORS: Record<string, string> = {
  'Suporte Técnico': '#10b981',
  'Vendas':          '#3b82f6',
  'Financeiro':      '#f59e0b',
  'RH':              '#8b5cf6',
  'Outros':          '#ef4444',
}

interface Props {
  data: ResolutionByDept[]
  loading: boolean
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as ResolutionByDept
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-medium)] rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="text-[var(--text-primary)] font-semibold mb-1">{d.department}</p>
      <p className="text-[var(--text-secondary)]">Taxa: <span className="text-[var(--text-primary)] font-bold">{d.rate}%</span></p>
      <p className="text-[var(--text-secondary)]">Resolvidas: <span className="text-[var(--text-primary)]">{d.resolved}</span></p>
      <p className="text-[var(--text-secondary)]">Total: <span className="text-[var(--text-primary)]">{d.total}</span></p>
    </div>
  )
}

export default function ResolutionByDeptChart({ data, loading }: Props) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Resolução por Departamento</h3>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Taxa de resolução (%) por depto</p>
      </div>

      {loading ? (
        <div className="h-52 bg-[var(--bg-page)]/30 rounded-xl animate-pulse" />
      ) : data.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-[var(--text-tertiary)] text-sm">
          Nenhum departamento configurado
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" horizontal={false} />
            <XAxis
              type="number" domain={[0, 100]}
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${v}%`}
            />
            <YAxis
              type="category" dataKey="department"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="rate" radius={[0, 6, 6, 0]} maxBarSize={20}>
              {data.map(entry => (
                <Cell key={entry.department} fill={COLORS[entry.department] ?? '#64748b'} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
