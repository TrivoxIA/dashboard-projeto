import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { api } from '@/lib/api'
import type { Flow, FlowInput } from '@/lib/api'

function parseCron(expr: string): string {
  if (!expr.trim()) return ''
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return 'Expressão inválida'
  const [min, hr, dom, , dow] = parts

  if (expr === '* * * * *')   return 'A cada minuto'
  if (expr === '0 * * * *')   return 'A cada hora'
  if (expr === '0 0 * * *')   return 'Diariamente à meia-noite'
  if (expr === '0 8 * * 1-5') return 'Dias úteis às 8h'
  if (min.startsWith('*/'))   return `A cada ${min.slice(2)} minutos`
  if (hr.startsWith('*/') && min === '0') return `A cada ${hr.slice(2)} horas`
  if (dom === '*' && dow === '*') return `Diariamente às ${hr.padStart(2,'0')}:${min.padStart(2,'0')}`
  return 'Agendamento personalizado'
}

function genWebhookUrl() {
  const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
  return `/api/webhooks/${id}`
}

interface Props {
  flow?: Flow | null
  onClose: () => void
  onSaved: () => void
}

const BLANK: Partial<FlowInput> = {
  name: '', description: '', type: 'webhook', status: 'inactive',
  webhook_url: '', cron_expression: '', field_mapping: {}, config: {},
}

export default function FlowForm({ flow, onClose, onSaved }: Props) {
  const [form, setForm]   = useState<Partial<FlowInput>>(flow ? { ...flow } : { ...BLANK })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (form.type === 'webhook' && !form.webhook_url) {
      setForm(p => ({ ...p, webhook_url: genWebhookUrl() }))
    }
  }, [form.type])

  function set(key: keyof FlowInput, value: unknown) {
    setForm(p => ({ ...p, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name?.trim()) { setError('Nome é obrigatório.'); return }
    setSaving(true)
    try {
      if (flow) {
        await api.updateFlow(flow.id, form)
      } else {
        await api.createFlow(form)
      }
      onSaved()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const TYPE_OPTIONS = [
    { value: 'webhook',   label: 'Webhook — recebe chamadas HTTP' },
    { value: 'scheduled', label: 'Agendado — executa por cron' },
    { value: 'manual',    label: 'Manual — executado pelo usuário' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[var(--bg-card)] border border-[var(--border-medium)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            {flow ? 'Editar Fluxo' : 'Novo Fluxo'}
          </h2>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-xs text-[var(--text-tertiary)] mb-1">Nome <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.name ?? ''}
              onChange={e => set('name', e.target.value)}
              placeholder="Ex: Recepção WhatsApp"
              className="w-full bg-[var(--bg-page)]/50 border border-[var(--border-medium)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs text-[var(--text-tertiary)] mb-1">Descrição</label>
            <textarea
              value={form.description ?? ''}
              onChange={e => set('description', e.target.value)}
              placeholder="Descreva o que este fluxo faz..."
              rows={2}
              className="w-full bg-[var(--bg-page)]/50 border border-[var(--border-medium)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-emerald-500/50 resize-none"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs text-[var(--text-tertiary)] mb-1">Tipo</label>
            <select
              value={form.type ?? 'webhook'}
              onChange={e => set('type', e.target.value)}
              className="w-full bg-[var(--bg-page)]/50 border border-[var(--border-medium)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50"
            >
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Webhook URL */}
          {form.type === 'webhook' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-[var(--text-tertiary)]">URL do Webhook</label>
                <button
                  type="button"
                  onClick={() => set('webhook_url', genWebhookUrl())}
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  Gerar nova URL
                </button>
              </div>
              <input
                type="text"
                value={form.webhook_url ?? ''}
                onChange={e => set('webhook_url', e.target.value)}
                className="w-full bg-[var(--bg-page)]/50 border border-[var(--border-medium)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-secondary)] font-mono focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          )}

          {/* Cron */}
          {form.type === 'scheduled' && (
            <div>
              <label className="block text-xs text-[var(--text-tertiary)] mb-1">Expressão Cron</label>
              <input
                type="text"
                value={form.cron_expression ?? ''}
                onChange={e => set('cron_expression', e.target.value)}
                placeholder="*/5 * * * *"
                className="w-full bg-[var(--bg-page)]/50 border border-[var(--border-medium)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] font-mono placeholder-[var(--text-placeholder)] focus:outline-none focus:border-emerald-500/50"
              />
              {form.cron_expression && (
                <p className="text-[11px] text-emerald-400 mt-1">
                  → {parseCron(form.cron_expression)}
                </p>
              )}
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-xs text-[var(--text-tertiary)] mb-1">Status inicial</label>
            <div className="flex gap-2">
              {['inactive', 'active'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set('status', s)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    form.status === s
                      ? s === 'active'
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-[var(--border-zinc)]/50 border-white/[0.15] text-[var(--text-primary)]'
                      : 'bg-[var(--bg-page)]/40 border-[var(--border-default)] text-[var(--text-tertiary)]'
                  }`}
                >
                  {s === 'active' ? 'Ativo' : 'Inativo'}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[var(--bg-page)]/50 hover:bg-[var(--border-zinc)]/40 text-[var(--text-secondary)] text-sm font-medium rounded-xl py-2.5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-[var(--text-primary)] text-sm font-medium rounded-xl py-2.5 transition-colors"
            >
              {saving ? 'Salvando...' : flow ? 'Salvar alterações' : 'Criar fluxo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
