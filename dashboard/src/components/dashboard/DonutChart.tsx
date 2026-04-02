import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DepartmentResolution } from '@/lib/api'

interface Props {
  data: DepartmentResolution[]
  loading?: boolean
  title?: string
  subtitle?: string
  valueLabel?: string
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']

function CustomTooltip({ active, payload, valueLabel }: any) {
  if (!active || !payload?.length) return null
  const { department, value, percentage } = payload[0].payload
  return (
    <div className="bg-[#27272a] border border-white/[0.08] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{department}</p>
      <p className="text-sm font-semibold text-white">
        {value} {valueLabel ?? 'resoluções'}
        <span className="text-slate-400 font-normal ml-1">({percentage}%)</span>
      </p>
    </div>
  )
}

export default function DonutChart({ data, loading, title = 'Resolução por Departamento', subtitle = 'Últimos 7 dias', valueLabel }: Props) {
  return (
    <div className="bg-[#27272a] border border-white/[0.06] rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      {loading ? (
        <div className="h-52 bg-white/[0.03] rounded-lg animate-pulse" />
      ) : (
        <div className="flex items-center gap-4">
          {/* Gráfico */}
          <div className="flex-shrink-0">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip valueLabel={valueLabel} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda */}
          <div className="flex-1 space-y-2.5 min-w-0">
            {data.map((item, index) => (
              <div key={item.department} className="flex items-center gap-2.5">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400 truncate">{item.department}</span>
                    <span className="text-xs font-semibold text-white shrink-0">
                      {item.percentage}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-1 h-1 rounded-full bg-white/[0.05]">
                    <div
                      className="h-1 rounded-full transition-all"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
