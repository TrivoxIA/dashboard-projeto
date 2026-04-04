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
    <div className="bg-[#27272a] border border-white/[0.08] rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="text-white font-semibold mb-1">{d.department}</p>
      <p className="text-slate-400">Taxa: <span className="text-white font-bold">{d.rate}%</span></p>
      <p className="text-slate-400">Resolvidas: <span className="text-white">{d.resolved}</span></p>
      <p className="text-slate-400">Total: <span className="text-white">{d.total}</span></p>
    </div>
  )
}

export default function ResolutionByDeptChart({ data, loading }: Props) {
  return (
    <div className="bg-[#27272a] border border-white/[0.06] rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Resolução por Departamento</h3>
        <p className="text-xs text-slate-500 mt-0.5">Taxa de resolução (%) por depto</p>
      </div>

      {loading ? (
        <div className="h-52 bg-white/[0.02] rounded-xl animate-pulse" />
      ) : data.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-slate-500 text-sm">
          Nenhum departamento configurado
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis
              type="number" domain={[0, 100]}
              tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${v}%`}
            />
            <YAxis
              type="category" dataKey="department"
              tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
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
