import AgentCard, { AgentCardSkeleton, type AgentCardData } from './AgentCard'

interface Props {
  agents: AgentCardData[]
  loading: boolean
  onSelect: (id: string) => void
}

export default function AgentGrid({ agents, loading, onSelect }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <AgentCardSkeleton key={i} />)}
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <p className="text-sm">Nenhum agente encontrado.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {agents.map(agent => (
        <AgentCard key={agent.id} agent={agent} onClick={onSelect} />
      ))}
    </div>
  )
}
