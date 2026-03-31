import { useState } from 'react'
import { User, Lock, Check, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function ProfileSection() {
  const { user } = useAuth()

  const [showPwForm, setShowPwForm] = useState(false)
  const [newPw, setNewPw]           = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [saving, setSaving]         = useState(false)
  const [msg, setMsg]               = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confirmPw) { setMsg({ type: 'err', text: 'As senhas não coincidem.' }); return }
    if (newPw.length < 6)    { setMsg({ type: 'err', text: 'A senha deve ter pelo menos 6 caracteres.' }); return }

    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setSaving(false)

    if (error) {
      setMsg({ type: 'err', text: error.message })
    } else {
      setMsg({ type: 'ok', text: 'Senha alterada com sucesso!' })
      setNewPw(''); setConfirmPw(''); setShowPwForm(false)
    }
    setTimeout(() => setMsg(null), 4000)
  }

  return (
    <div className="space-y-6">
      {/* Info card */}
      <div className="bg-[#27272a] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <span className="text-xl font-bold text-emerald-400 uppercase">
              {user?.email?.[0] ?? 'U'}
            </span>
          </div>
          <div>
            <p className="font-semibold text-white">{user?.email}</p>
            <span className="text-xs text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full font-medium">
              Admin
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">E-mail</p>
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
              <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <p className="text-sm text-white">{user?.email}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">ID do Usuário</p>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
              <p className="text-sm text-slate-400 font-mono truncate">{user?.id}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Criado em</p>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
              <p className="text-sm text-slate-400">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                  : '—'}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Último acesso</p>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
              <p className="text-sm text-slate-400">
                {user?.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Password section */}
      <div className="bg-[#27272a] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-white">Alterar Senha</h3>
          </div>
          {!showPwForm && (
            <button
              onClick={() => setShowPwForm(true)}
              className="text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              Alterar
            </button>
          )}
        </div>

        {msg && (
          <div className={`mb-4 flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
            msg.type === 'ok'
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-red-500/15 text-red-400'
          }`}>
            {msg.type === 'ok' && <Check className="h-3.5 w-3.5" />}
            {msg.text}
          </div>
        )}

        {showPwForm && (
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nova senha</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Confirmar nova senha</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2 transition-colors"
              >
                {saving ? 'Salvando...' : 'Salvar senha'}
              </button>
              <button
                type="button"
                onClick={() => { setShowPwForm(false); setNewPw(''); setConfirmPw('') }}
                className="flex-1 bg-white/[0.04] hover:bg-white/[0.07] text-slate-400 text-sm font-medium rounded-lg py-2 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {!showPwForm && !msg && (
          <p className="text-xs text-slate-500">Sua senha atual está ativa. Clique em "Alterar" para definir uma nova.</p>
        )}
      </div>
    </div>
  )
}
