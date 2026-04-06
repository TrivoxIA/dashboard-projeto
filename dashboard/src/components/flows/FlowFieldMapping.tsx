import { useState } from 'react'
import { ArrowRight, Plus, Trash2, Save } from 'lucide-react'
import type { Flow } from '@/lib/api'
import { api } from '@/lib/api'

interface Props {
  flow: Flow
  onUpdated: (flow: Flow) => void
}

const CRM_FIELDS = [
  'contato.telefone', 'contato.email', 'contato.nome', 'contato.qualificacao',
  'conversa.mensagem', 'conversa.tipo', 'conversa.id', 'conversa.departamento',
  'agente.id', 'agente.nome',
]

export default function FlowFieldMapping({ flow, onUpdated }: Props) {
  const [editing, setEditing] = useState(false)
  const [mapping, setMapping] = useState<Record<string, string>>(flow.field_mapping ?? {})
  const [saving, setSaving]   = useState(false)

  function addRow() {
    setMapping(prev => ({ ...prev, '': '' }))
  }

  function removeRow(key: string) {
    const next = { ...mapping }
    delete next[key]
    setMapping(next)
  }

  function updateKey(oldKey: string, newKey: string) {
    const next: Record<string, string> = {}
    for (const [k, v] of Object.entries(mapping)) {
      next[k === oldKey ? newKey : k] = v
    }
    setMapping(next)
  }

  function updateValue(key: string, value: string) {
    setMapping(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    await api.updateFlow(flow.id, { field_mapping: mapping })
    const updated = await api.getFlowById(flow.id)
    if (updated) onUpdated(updated)
    setSaving(false)
    setEditing(false)
  }

  const entries = Object.entries(mapping)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-[var(--text-primary)]">Mapeamento de Campos</h4>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Campos do webhook → campos do CRM</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            Editar mapeamento
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditing(false); setMapping(flow.field_mapping ?? {}) }}
              className="text-xs text-[var(--text-secondary)] bg-[var(--bg-page)]/50 hover:bg-[var(--border-zinc)]/40 px-3 py-1.5 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs text-[var(--text-primary)] bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Save className="h-3 w-3" />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}
      </div>

      {entries.length === 0 && !editing && (
        <div className="text-center py-8 text-[var(--text-tertiary)] text-sm bg-[var(--bg-page)]/30 border border-[var(--border-default)] rounded-xl">
          Nenhum mapeamento configurado.<br />
          <button onClick={() => setEditing(true)} className="text-emerald-400 hover:underline mt-1 text-xs">
            Adicionar mapeamento
          </button>
        </div>
      )}

      <div className="space-y-3">
        {/* Header */}
        {entries.length > 0 && (
          <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-3 items-center px-1">
            <p className="text-[11px] text-[var(--text-tertiary)] font-medium uppercase tracking-wide">Campo de origem (webhook)</p>
            <div />
            <p className="text-[11px] text-[var(--text-tertiary)] font-medium uppercase tracking-wide">Campo de destino (CRM)</p>
            <div />
          </div>
        )}

        {entries.map(([key, value]) => (
          <div key={key} className="grid grid-cols-[1fr_auto_1fr_auto] gap-3 items-center">
            {editing ? (
              <>
                <input
                  type="text"
                  value={key}
                  onChange={e => updateKey(key, e.target.value)}
                  placeholder="campo_origem"
                  className="bg-[var(--bg-page)]/50 border border-[var(--border-medium)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] font-mono placeholder-[var(--text-placeholder)] focus:outline-none focus:border-emerald-500/40"
                />
                <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)] shrink-0" />
                <select
                  value={value}
                  onChange={e => updateValue(key, e.target.value)}
                  className="bg-[var(--bg-page)]/50 border border-[var(--border-medium)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/40"
                >
                  <option value="">Selecionar campo...</option>
                  {CRM_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <button onClick={() => removeRow(key)} className="text-[var(--text-tertiary)] hover:text-red-400 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <div className="bg-[var(--bg-page)]/40 border border-[var(--border-default)] rounded-lg px-3 py-2">
                  <code className="text-xs text-sky-400 font-mono">{key || '—'}</code>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)] shrink-0" />
                <div className="bg-[var(--bg-page)]/40 border border-[var(--border-default)] rounded-lg px-3 py-2">
                  <code className="text-xs text-emerald-400 font-mono">{value || '—'}</code>
                </div>
                <div />
              </>
            )}
          </div>
        ))}

        {editing && (
          <button
            onClick={addRow}
            className="flex items-center gap-2 w-full justify-center py-2.5 rounded-lg border border-dashed border-[var(--border-strong)] text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-white/[0.20] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar campo
          </button>
        )}
      </div>
    </div>
  )
}
