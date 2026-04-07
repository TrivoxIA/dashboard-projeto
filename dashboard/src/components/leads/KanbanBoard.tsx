import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import LeadCard from './LeadCard'
import type { Lead } from './LeadCard'

export interface Stage {
  id: string
  name: string
  color: string
  position: number
  is_final: boolean
}

interface Props {
  stages: Stage[]
  leads: Lead[]
  onLeadMoved: () => void
}

const STAGE_LABEL: Record<string, string> = {
  'Novo': 'Lead',
  'Fechado': 'Agendado',
}

export default function KanbanBoard({ stages, leads, onLeadMoved }: Props) {
  const [overStageId, setOverStageId] = useState<string | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, leadId: string) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', leadId)
      }, [])

  const handleDragOver = useCallback((e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverStageId(stageId)
  }, [])

  const handleDragLeave = useCallback(() => {
    setOverStageId(null)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault()
    setOverStageId(null)
    const leadId = e.dataTransfer.getData('text/plain')
    if (!leadId) return

    const lead = leads.find(l => l.id === leadId)
    if (!lead || lead.stage_id === targetStageId) return

    await supabase.from('leads').update({ stage_id: targetStageId, updated_at: new Date().toISOString() }).eq('id', leadId)
    onLeadMoved()
  }, [leads, onLeadMoved])

  const sortedStages = [...stages].sort((a, b) => a.position - b.position)

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 px-6 min-h-0 flex-1">
      {sortedStages.map(stage => {
        const stageLeads = leads.filter(l => l.stage_id === stage.id)
        const isDragOver = overStageId === stage.id

        return (
          <div
            key={stage.id}
            className="flex flex-col min-w-[280px] w-[280px] shrink-0"
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            {/* Column header */}
            <div className="rounded-t-lg px-3 py-2.5" style={{ borderTop: `3px solid ${stage.color}` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{STAGE_LABEL[stage.name] ?? stage.name}</span>
                  <span className="text-[11px] font-medium text-[var(--text-tertiary)] bg-[var(--bg-page)] px-1.5 py-0.5 rounded">
                    {stageLeads.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Column body */}
            <div
              className={`flex-1 rounded-b-lg p-2 space-y-2 transition-colors min-h-[120px] ${
                isDragOver
                  ? 'bg-[var(--border-zinc)]/30 ring-1 ring-cyan-500/30'
                  : 'bg-[var(--bg-page)]/40'
              }`}
            >
              {stageLeads.map(lead => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onDragStart={handleDragStart}
                />
              ))}

              {stageLeads.length === 0 && !isDragOver && (
                <div className="flex items-center justify-center h-20 text-xs text-[var(--text-tertiary)]">
                  Nenhum lead
                </div>
              )}

              {isDragOver && (
                <div className="border-2 border-dashed border-cyan-500/30 rounded-lg h-16 flex items-center justify-center">
                  <span className="text-xs text-cyan-500/60">Soltar aqui</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
