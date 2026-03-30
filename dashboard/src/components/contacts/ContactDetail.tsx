import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatRelativeTime } from '@/lib/utils'
import { Mail, Phone, Building2, MessageSquare, CheckCircle2, Clock, Edit2 } from 'lucide-react'
import Modal from '@/components/shared/Modal'
import ContactForm from './ContactForm'
import { useToast, ToastContainer } from '@/components/shared/Toast'

interface Contact {
  id: string; name: string; email: string | null
  phone: string | null; company: string | null; created_at: string
}
interface Conversation {
  id: string; status: string; department: string; started_at: string
  ended_at: string | null; agents: { name: string } | null
}

const STATUS_CFG = {
  resolved: { label: 'Resolvido', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  pending:  { label: 'Pendente',  cls: 'bg-amber-500/15  text-amber-400  border-amber-500/20'  },
  open:     { label: 'Aberto',    cls: 'bg-blue-500/15   text-blue-400   border-blue-500/20'   },
} as const

interface Props { contactId: string }

export default function ContactDetail({ contactId }: Props) {
  const navigate = useNavigate()
  const { toasts, show, remove } = useToast()
  const [contact, setContact] = useState<Contact | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)

  async function load() {
    setLoading(true)
    const [{ data: c }, { data: convs }] = await Promise.all([
      supabase.from('contacts').select('*').eq('id', contactId).single(),
      supabase.from('conversations')
        .select('id, status, department, started_at, ended_at, agents(name)')
        .eq('contact_id', contactId)
        .order('started_at', { ascending: false })
        .limit(20),
    ])
    setContact(c)
    setConversations((convs as any) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [contactId])

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-white/[0.04] animate-pulse" />)}
    </div>
  )
  if (!contact) return <p className="text-slate-500 text-sm">Contato não encontrado.</p>

  const resolved = conversations.filter(c => c.status === 'resolved').length
  const resRate = conversations.length > 0 ? Math.round((resolved / conversations.length) * 100) : 0

  const durations = conversations
    .filter(c => c.ended_at)
    .map(c => (new Date(c.ended_at!).getTime() - new Date(c.started_at).getTime()) / 1000)
  const avgTime = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={remove} />

      {/* Informações */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-lg font-bold text-emerald-400 uppercase">{contact.name[0]}</span>
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">{contact.name}</h3>
              <p className="text-xs text-slate-500">Desde {new Date(contact.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg px-3 py-1.5 transition-colors"
          >
            <Edit2 className="h-3 w-3" /> Editar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Mail,      label: 'E-mail',   value: contact.email },
            { icon: Phone,     label: 'Telefone', value: contact.phone },
            { icon: Building2, label: 'Empresa',  value: contact.company },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs text-slate-500">{label}</span>
              </div>
              <p className="text-sm text-white truncate">{value ?? '—'}</p>
            </div>
          ))}
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: MessageSquare, label: 'Conversas',  value: conversations.length },
            { icon: CheckCircle2,  label: 'Resolvidas', value: `${resRate}%` },
            { icon: Clock,         label: 'Tempo Médio',value: avgTime > 0 ? `${avgTime}s` : '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <Icon className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Histórico */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Histórico de conversas</p>
          {conversations.length === 0
            ? <p className="text-sm text-slate-500 py-4 text-center">Nenhuma conversa encontrada.</p>
            : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {conversations.map(conv => {
                  const cfg = STATUS_CFG[conv.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.open
                  return (
                    <div
                      key={conv.id}
                      onClick={() => navigate(`/conversas/${conv.id}`)}
                      className="flex items-center justify-between bg-white/[0.03] border border-white/[0.05] rounded-lg px-3 py-2.5 hover:border-white/[0.10] cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="text-xs text-white">{conv.department}</p>
                        <p className="text-[10px] text-slate-500">{(conv.agents as any)?.name ?? 'Sem agente'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] border px-1.5 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                        <span className="text-[10px] text-slate-500">{formatRelativeTime(conv.started_at)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
        </div>
      </div>

      {/* Modal editar */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar contato">
        <ContactForm
          initial={{ id: contact.id, name: contact.name, email: contact.email ?? '', phone: contact.phone ?? '', company: contact.company ?? '' }}
          onSuccess={() => { setEditOpen(false); load(); show('Contato atualizado!') }}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>
    </>
  )
}
