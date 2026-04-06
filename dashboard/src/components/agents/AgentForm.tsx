import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import type { AgentStatus } from './AgentStatusBadge'

export interface AgentFormData {
  name: string
  department: string
  status: AgentStatus
}

interface Props {
  initial?: AgentFormData & { id?: string }
  onSuccess: () => void
  onCancel: () => void
}

const DEPARTMENTS = ['Suporte Técnico', 'Vendas', 'Financeiro', 'RH', 'Outros']
const EMPTY: AgentFormData = { name: '', department: 'Suporte Técnico', status: 'active' }

export default function AgentForm({ initial, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState<AgentFormData>(initial ?? EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setForm(initial ?? EMPTY) }, [initial])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nome é obrigatório'); return }
    setError(null)
    setLoading(true)
    try {
      if (initial?.id) {
        const { error } = await supabase.from('agents').update({ name: form.name, department: form.department }).eq('id', initial.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('agents').insert(form)
        if (error) throw error
      }
      onSuccess()
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar agente')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full rounded-lg bg-[var(--border-zinc)]/30 border border-[var(--border-medium)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors'
  const selCls   = inputCls + ' cursor-pointer'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[var(--text-secondary)]">Nome <span className="text-red-400">*</span></label>
        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="Nome do agente" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[var(--text-secondary)]">Departamento</label>
        <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className={selCls}>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      {!initial?.id && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Status inicial</label>
          <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as AgentStatus }))} className={selCls}>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>
      )}
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-[var(--border-medium)] bg-[var(--bg-page)]/50 hover:bg-[var(--border-zinc)]/50 text-[var(--text-secondary)] text-sm py-2.5 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[var(--text-primary)] text-sm font-medium py-2.5 transition-colors">
          {loading ? 'Salvando...' : initial?.id ? 'Salvar alterações' : 'Adicionar agente'}
        </button>
      </div>
    </form>
  )
}
