import { useState } from 'react'
import { Settings as SettingsIcon, User, Webhook, Sliders, Database } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import ProfileSection from '@/components/settings/ProfileSection'
import IntegrationSettings from '@/components/settings/IntegrationSettings'
import DashboardCustomization from '@/components/settings/DashboardCustomization'
import DataMaintenance from '@/components/settings/DataMaintenance'

type Tab = 'profile' | 'integrations' | 'customization' | 'maintenance'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'profile',       label: 'Perfil',           icon: User },
  { id: 'integrations',  label: 'Integrações',      icon: Webhook },
  { id: 'customization', label: 'Personalização',   icon: Sliders },
  { id: 'maintenance',   label: 'Manutenção',       icon: Database },
]

export default function Settings() {
  const [tab, setTab] = useState<Tab>('profile')

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-[900px]">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-500/20 border border-slate-500/30">
            <SettingsIcon className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Configurações</h2>
            <p className="text-sm text-slate-500 mt-0.5">Gerencie sua conta e preferências</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 w-fit">
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/[0.08] text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {tab === 'profile'       && <ProfileSection />}
        {tab === 'integrations'  && <IntegrationSettings />}
        {tab === 'customization' && <DashboardCustomization />}
        {tab === 'maintenance'   && <DataMaintenance />}
      </div>
    </AppLayout>
  )
}
