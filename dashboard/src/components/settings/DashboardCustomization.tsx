import { useState, useEffect } from 'react'
import { Sliders, Bell, LayoutDashboard } from 'lucide-react'
import { api } from '@/lib/api'

interface Toggle {
  key: string
  label: string
  description: string
}

const KPI_TOGGLES: Toggle[] = [
  { key: 'show_kpi_conversations',  label: 'Conversas Hoje',           description: 'Exibir card de conversas do dia' },
  { key: 'show_kpi_agents',         label: 'Agentes Ativos',           description: 'Exibir card de agentes ativos' },
  { key: 'show_kpi_resolution',     label: 'Taxa de Resolução',        description: 'Exibir card de taxa de resolução' },
  { key: 'show_kpi_response_time',  label: 'Tempo Médio de Resposta',  description: 'Exibir card de tempo de resposta' },
]

const NOTIF_TOGGLES: Toggle[] = [
  { key: 'notifications_enabled', label: 'Notificações', description: 'Ativar alertas e notificações do sistema' },
]

interface ToggleRowProps {
  toggle: Toggle
  value: boolean
  onChange: (key: string, v: boolean) => void
}

function ToggleRow({ toggle, value, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
      <div>
        <p className="text-sm text-[var(--text-primary)] font-medium">{toggle.label}</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{toggle.description}</p>
      </div>
      <button
        onClick={() => onChange(toggle.key, !value)}
        className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${value ? 'bg-emerald-500' : 'bg-[var(--border-zinc)]/50'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  )
}

export default function DashboardCustomization() {
  const [settings, setSettings] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  useEffect(() => {
    api.getSettings().then(s => {
      const bools: Record<string, boolean> = {}
      for (const t of [...KPI_TOGGLES, ...NOTIF_TOGGLES]) {
        bools[t.key] = s[t.key] !== 'false'
      }
      setSettings(bools)
    })
  }, [])

  async function handleToggle(key: string, value: boolean) {
    setSettings(prev => ({ ...prev, [key]: value }))
    await api.upsertSetting(key, String(value))
  }

  async function handleSave() {
    setSaving(true)
    await Promise.all(
      Object.entries(settings).map(([k, v]) => api.upsertSetting(k, String(v)))
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <LayoutDashboard className="h-4 w-4 text-[var(--text-secondary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Cards do Dashboard</h3>
        </div>
        <div>
          {KPI_TOGGLES.map(t => (
            <ToggleRow
              key={t.key}
              toggle={t}
              value={settings[t.key] ?? true}
              onChange={handleToggle}
            />
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4 text-[var(--text-secondary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notificações</h3>
        </div>
        <div>
          {NOTIF_TOGGLES.map(t => (
            <ToggleRow
              key={t.key}
              toggle={t}
              value={settings[t.key] ?? true}
              onChange={handleToggle}
            />
          ))}
        </div>
      </div>

      {/* Theme info */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="h-4 w-4 text-[var(--text-secondary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Tema</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-[var(--bg-page)] border-2 border-emerald-500/50 rounded-xl p-3 flex items-center gap-2">
            <span className="h-4 w-4 rounded-full bg-[var(--bg-page)] border border-emerald-500/50" />
            <span className="text-sm text-[var(--text-primary)] font-medium">Escuro</span>
            <span className="ml-auto text-xs text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">Ativo</span>
          </div>
          <div className="flex-1 bg-[var(--bg-page)]/40 border border-[var(--border-default)] rounded-xl p-3 flex items-center gap-2 opacity-40 cursor-not-allowed">
            <span className="h-4 w-4 rounded-full bg-slate-200 border border-slate-300" />
            <span className="text-sm text-[var(--text-secondary)]">Claro</span>
            <span className="ml-auto text-xs text-[var(--text-tertiary)] bg-[var(--border-zinc)]/30 px-2 py-0.5 rounded-full">Em breve</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-[var(--text-primary)] text-sm font-medium rounded-xl py-2.5 transition-colors"
      >
        {saving ? 'Salvando...' : saved ? '✓ Configurações salvas!' : 'Salvar preferências'}
      </button>
    </div>
  )
}
