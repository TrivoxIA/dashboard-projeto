import { useState } from 'react'
import { Database, Download, Trash2, Info, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface SysInfo {
  conversations: number
  contacts: number
  agents: number
}

export default function DataMaintenance() {
  const [sysInfo, setSysInfo]         = useState<SysInfo | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(false)
  const [exporting, setExporting]     = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function loadSysInfo() {
    setLoadingInfo(true)
    const [{ count: conv }, { count: cont }, { count: ag }] = await Promise.all([
      supabase.from('crm_conversations').select('*', { count: 'exact', head: true }),
      supabase.from('contacts').select('*', { count: 'exact', head: true }),
      supabase.from('agents').select('*', { count: 'exact', head: true }),
    ])
    setSysInfo({ conversations: conv ?? 0, contacts: cont ?? 0, agents: ag ?? 0 })
    setLoadingInfo(false)
  }

  async function handleExport() {
    setExporting(true)
    const [{ data: convs }, { data: contacts }, { data: agents }] = await Promise.all([
      supabase.from('crm_conversations').select('*').order('created_at', { ascending: false }),
      supabase.from('contacts').select('*').order('created_at', { ascending: false }),
      supabase.from('agents').select('*'),
    ])

    const payload = {
      exported_at: new Date().toISOString(),
      conversations: convs ?? [],
      contacts: contacts ?? [],
      agents: agents ?? [],
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `agente-sdr-backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  async function handleDeleteTestData() {
    setDeleting(true)
    // Delete conversations with "test" in notes, or created more than 90 days ago
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 90)
    await supabase.from('crm_conversations').delete().lt('created_at', cutoff.toISOString())
    setDeleting(false)
    setConfirmDelete(false)
    await loadSysInfo()
  }

  return (
    <div className="space-y-4">
      {/* System info */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-[var(--text-secondary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Informações do Sistema</h3>
          </div>
          <button
            onClick={loadSysInfo}
            disabled={loadingInfo}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-page)]/50 hover:bg-[var(--border-zinc)]/40 border border-[var(--border-default)] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
          >
            {loadingInfo ? 'Carregando...' : 'Verificar'}
          </button>
        </div>

        {sysInfo ? (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Conversas',  value: sysInfo.conversations, color: '#3b82f6' },
              { label: 'Contatos',   value: sysInfo.contacts,      color: '#10b981' },
              { label: 'Agentes',    value: sysInfo.agents,        color: '#8b5cf6' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[var(--bg-page)]/40 border border-[var(--border-default)] rounded-lg p-3 text-center">
                <p className="text-xl font-bold" style={{ color }}>{value}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-tertiary)]">Clique em "Verificar" para carregar as informações.</p>
        )}

        <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
          <div className="flex items-center gap-3">
            <Database className="h-4 w-4 text-[var(--text-tertiary)]" />
            <div>
              <p className="text-xs text-[var(--text-primary)]">Supabase PostgreSQL</p>
              <p className="text-[11px] text-[var(--text-tertiary)]">Banco de dados gerenciado na nuvem</p>
            </div>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Download className="h-4 w-4 text-[var(--text-secondary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Exportar Todos os Dados</h3>
        </div>
        <p className="text-xs text-[var(--text-tertiary)] mb-4">
          Exporta conversas, contatos e agentes em formato JSON para backup ou análise externa.
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 bg-[var(--border-zinc)]/30 hover:bg-[var(--border-zinc)]/50 border border-[var(--border-medium)] text-sm text-[var(--text-primary)] rounded-lg px-4 py-2.5 transition-colors disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />
          {exporting ? 'Exportando...' : 'Baixar backup JSON'}
        </button>
      </div>

      {/* Delete test data */}
      <div className="bg-[var(--bg-card)] border border-red-500/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <h3 className="text-sm font-semibold text-red-400">Zona de Risco</h3>
        </div>
        <p className="text-xs text-[var(--text-tertiary)] mb-4">
          Remove conversas com mais de 90 dias. Esta ação é <strong className="text-red-400">irreversível</strong>.
        </p>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-sm text-red-400 rounded-lg px-4 py-2.5 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Limpar dados de teste
          </button>
        ) : (
          <div className="space-y-3">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <p className="text-sm text-red-400 font-medium">Tem certeza?</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">Todas as conversas com mais de 90 dias serão excluídas permanentemente.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDeleteTestData}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-400 disabled:opacity-60 text-[var(--text-primary)] text-sm font-medium rounded-lg py-2.5 transition-colors"
              >
                {deleting ? 'Excluindo...' : 'Confirmar exclusão'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 bg-[var(--bg-page)]/50 hover:bg-[var(--border-zinc)]/40 text-[var(--text-secondary)] text-sm font-medium rounded-lg py-2.5 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
