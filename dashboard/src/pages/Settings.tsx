import { useState } from 'react'
import { User, Webhook, Sliders, Database } from 'lucide-react'
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
        {/* Header — V0 style */}
        <div>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-zinc-400">Gerencie as configurações da sua conta e integrações</p>
        </div>

        {/* Tab bar — V0 TabsList style */}
        <div className="grid grid-cols-2 md:grid-cols-4 bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-1 w-full">
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-zinc-700/60 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
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
