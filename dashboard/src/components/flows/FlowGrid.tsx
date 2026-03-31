import FlowCard, { FlowCardSkeleton } from './FlowCard'
import type { Flow } from '@/lib/api'

interface Props {
  flows: Flow[]
  loading: boolean
  onEdit:   (flow: Flow) => void
  onToggle: (flow: Flow) => void
  onLogs:   (flow: Flow) => void
  onDelete: (flow: Flow) => void
}

export default function FlowGrid({ flows, loading, onEdit, onToggle, onLogs, onDelete }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <FlowCardSkeleton key={i} />)}
      </div>
    )
  }

  if (flows.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-sm">Nenhum fluxo encontrado.</p>
        <p className="text-xs mt-1">Crie um fluxo com o botão "Adicionar Fluxo".</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {flows.map(flow => (
        <FlowCard
          key={flow.id}
          flow={flow}
          onEdit={onEdit}
          onToggle={onToggle}
          onLogs={onLogs}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
