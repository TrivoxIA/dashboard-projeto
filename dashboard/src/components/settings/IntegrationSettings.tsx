import { useState, useEffect } from 'react'
import { Webhook, Key, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

type TestStatus = 'idle' | 'testing' | 'ok' | 'fail'

export default function IntegrationSettings() {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [apiKey,     setApiKey]     = useState('')
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')

  useEffect(() => {
    api.getSettings().then(s => {
      setWebhookUrl(s['n8n_webhook_url'] ?? '')
      setApiKey(s['n8n_api_key'] ?? '')
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await Promise.all([
      api.upsertSetting('n8n_webhook_url', webhookUrl),
      api.upsertSetting('n8n_api_key', apiKey),
    ])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleTest() {
    if (!webhookUrl) return
    setTestStatus('testing')
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}) },
        body: JSON.stringify({ test: true, source: 'agente-sdr-dashboard' }),
      })
      setTestStatus(res.ok ? 'ok' : 'fail')
    } catch {
      setTestStatus('fail')
    }
    setTimeout(() => setTestStatus('idle'), 5000)
  }

  return (
    <div className="bg-[#27272a] border border-white/[0.06] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <Webhook className="h-4 w-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-white">Integração n8n</h3>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">URL do Webhook</label>
          <input
            type="url"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://seu-n8n.com/webhook/..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          <p className="text-[11px] text-slate-600 mt-1">URL do webhook n8n para receber notificações de novas conversas</p>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5">
            <Key className="h-3 w-3 inline-block mr-1" />
            API Key (opcional)
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Token de autenticação"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          <p className="text-[11px] text-slate-600 mt-1">Enviado como Bearer token no header Authorization</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-[#18181b] text-sm font-medium rounded-lg py-2.5 transition-colors"
          >
            {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar configurações'}
          </button>

          <button
            type="button"
            onClick={handleTest}
            disabled={!webhookUrl || testStatus === 'testing'}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] text-sm text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {testStatus === 'testing' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {testStatus === 'ok'      && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
            {testStatus === 'fail'    && <XCircle className="h-3.5 w-3.5 text-red-400" />}
            {testStatus === 'idle'    && <Webhook className="h-3.5 w-3.5" />}
            Testar
          </button>
        </div>

        {testStatus === 'ok' && (
          <p className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg">
            Conexão bem-sucedida! O webhook respondeu corretamente.
          </p>
        )}
        {testStatus === 'fail' && (
          <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
            Falha na conexão. Verifique a URL e tente novamente.
          </p>
        )}
      </form>
    </div>
  )
}
