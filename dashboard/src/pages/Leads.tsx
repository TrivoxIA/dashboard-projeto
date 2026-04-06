import { useEffect, useState, useCallback } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import KanbanBoard from '@/components/leads/KanbanBoard'
import AddLeadModal from '@/components/leads/AddLeadModal'
import { supabase } from '@/lib/supabase'
import type { Stage } from '@/components/leads/KanbanBoard'
import type { Lead } from '@/components/leads/LeadCard'

export default function Leads() {
  const [stages, setStages] = useState<Stage[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const load = useCallback(async () => {
    const [{ data: stagesData }, { data: leadsData }] = await Promise.all([
      supabase.from('lead_stages').select('*').order('position', { ascending: true }),
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
    ])
    setStages((stagesData ?? []) as Stage[])
    setLeads((leadsData ?? []) as Lead[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAddLead(data: { name: string; phone: string; email: string; company: string; notes: string }) {
    const firstStage = stages.find(s => s.position === 0) ?? stages[0]
    if (!firstStage) return

    await supabase.from('leads').insert([{
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      company: data.company || null,
      notes: data.notes || null,
      stage_id: firstStage.id,
      source: 'manual' as const,
      score: 0,
    }])

    await load()
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-white">Leads</h1>
            <p className="text-xs text-zinc-500 mt-0.5">{leads.length} leads no pipeline</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded-lg transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />
              Atualizar
            </button>
            <button onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors">
              <Plus className="h-3.5 w-3.5" />
              Adicionar Lead
            </button>
          </div>
        </div>

        {/* Board */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="h-5 w-5 text-zinc-500 animate-spin" />
          </div>
        ) : (
          <KanbanBoard stages={stages} leads={leads} onLeadMoved={load} />
        )}
      </div>

      <AddLeadModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleAddLead} />
    </AppLayout>
  )
}
