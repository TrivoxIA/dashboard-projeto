import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: { name: string; phone: string; email: string; company: string; notes: string }) => Promise<void>
}

export default function AddLeadModal({ open, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await onSave({ name: name.trim(), phone: phone.trim(), email: email.trim(), company: company.trim(), notes: notes.trim() })
    setSaving(false)
    setName(''); setPhone(''); setEmail(''); setCompany(''); setNotes('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-[#23232a] rounded-xl w-full max-w-md mx-4 border border-zinc-700/50" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700/50">
          <h2 className="text-sm font-semibold text-white">Adicionar Lead</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Nome *</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full bg-[#18181b] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50" placeholder="Nome do lead" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Telefone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full bg-[#18181b] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50" placeholder="+55 11 99999-0000" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email"
              className="w-full bg-[#18181b] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50" placeholder="email@exemplo.com" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Empresa</label>
            <input value={company} onChange={e => setCompany(e.target.value)}
              className="w-full bg-[#18181b] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50" placeholder="Empresa do lead" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Notas</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="w-full bg-[#18181b] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 resize-none" placeholder="Observações sobre o lead..." />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving || !name.trim()}
              className="px-4 py-2 text-sm font-medium bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg transition-colors">
              {saving ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
