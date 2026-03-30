import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'

export interface ContactFormData {
  name: string
  email: string
  phone: string
  company: string
}

interface Props {
  initial?: ContactFormData & { id?: string }
  onSuccess: () => void
  onCancel: () => void
}

const EMPTY: ContactFormData = { name: '', email: '', phone: '', company: '' }

export default function ContactForm({ initial, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState<ContactFormData>(initial ?? EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setForm(initial ?? EMPTY) }, [initial])

  const set = (k: keyof ContactFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nome é obrigatório'); return }
    setError(null)
    setLoading(true)
    try {
      if (initial?.id) {
        const { error } = await supabase.from('contacts').update(form).eq('id', initial.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('contacts').insert(form)
        if (error) throw error
      }
      onSuccess()
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar contato')
    } finally {
      setLoading(false)
    }
  }

  const fields: { key: keyof ContactFormData; label: string; type?: string; required?: boolean }[] = [
    { key: 'name',    label: 'Nome completo', required: true },
    { key: 'email',   label: 'E-mail',        type: 'email' },
    { key: 'phone',   label: 'Telefone' },
    { key: 'company', label: 'Empresa' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(f => (
        <div key={f.key} className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">
            {f.label}{f.required && <span className="text-red-400 ml-1">*</span>}
          </label>
          <input
            type={f.type ?? 'text'}
            value={form[f.key]}
            onChange={set(f.key)}
            className="w-full rounded-lg bg-white/[0.05] border border-white/[0.08] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
            placeholder={f.label}
          />
        </div>
      ))}

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-sm py-2.5 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-medium py-2.5 transition-colors"
        >
          {loading ? 'Salvando...' : initial?.id ? 'Salvar alterações' : 'Adicionar contato'}
        </button>
      </div>
    </form>
  )
}
