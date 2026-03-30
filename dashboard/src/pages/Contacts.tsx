import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import ContactsTable, { type ContactRow } from '@/components/contacts/ContactsTable'
import ContactFilters, { type ContactSort } from '@/components/contacts/ContactFilters'
import ContactDetail from '@/components/contacts/ContactDetail'
import ContactForm from '@/components/contacts/ContactForm'
import Modal from '@/components/shared/Modal'
import Pagination from '@/components/shared/Pagination'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { useToast, ToastContainer } from '@/components/shared/Toast'
import { UserPlus, Download } from 'lucide-react'

const PAGE_SIZE = 10

export default function Contacts() {
  const { toasts, show, remove } = useToast()
  const [data, setData] = useState<ContactRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<ContactSort>('name')

  // Modais
  const [addOpen, setAddOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const from = (page - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let query = supabase
      .from('contacts')
      .select('id, name, email, phone, company, created_at', { count: 'exact' })

    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`)
    }

    if (sort === 'name') query = query.order('name', { ascending: true })
    else query = query.order('created_at', { ascending: false })

    const { data: rows, count } = await query.range(from, to)
    const contacts = rows ?? []

    // Busca contagens de conversas e última interação
    const ids = contacts.map(c => c.id)
    let convMap: Record<string, { count: number; last: string | null }> = {}
    if (ids.length > 0) {
      const { data: convRows } = await supabase
        .from('conversations')
        .select('contact_id, started_at')
        .in('contact_id', ids)

      for (const id of ids) {
        const mine = (convRows ?? []).filter(c => c.contact_id === id)
        const sorted = mine.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
        convMap[id] = { count: mine.length, last: sorted[0]?.started_at ?? null }
      }
    }

    let result: ContactRow[] = contacts.map(c => ({
      ...c,
      conversations_count: convMap[c.id]?.count ?? 0,
      last_interaction:    convMap[c.id]?.last ?? null,
    }))

    if (sort === 'conversations_count') {
      result = result.sort((a, b) => b.conversations_count - a.conversations_count)
    }

    setData(result)
    setTotal(count ?? 0)
    setLoading(false)
  }, [page, search, sort])

  useEffect(() => { setPage(1) }, [search, sort])
  useEffect(() => { load() }, [load])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('contacts').delete().eq('id', deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    if (error) { show('Erro ao excluir contato', 'error'); return }
    show('Contato excluído com sucesso')
    load()
  }

  function exportCSV() {
    const headers = ['Nome', 'E-mail', 'Telefone', 'Empresa', 'Conversas']
    const rows = data.map(c => [c.name, c.email ?? '', c.phone ?? '', c.company ?? '', c.conversations_count])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'contatos.csv'; a.click()
    URL.revokeObjectURL(url)
    show('CSV exportado!')
  }

  return (
    <AppLayout>
      <ToastContainer toasts={toasts} onRemove={remove} />
      <div className="p-6 space-y-5 max-w-[1400px]">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Contatos</h2>
            <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
              {total}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] rounded-lg px-3 py-1.5 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Exportar CSV
            </button>
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 text-sm text-white bg-emerald-500 hover:bg-emerald-400 rounded-lg px-3 py-1.5 transition-colors font-medium"
            >
              <UserPlus className="h-3.5 w-3.5" /> Novo contato
            </button>
          </div>
        </div>

        {/* Filtros */}
        <ContactFilters search={search} onSearch={setSearch} sort={sort} onSort={setSort} />

        {/* Tabela */}
        <div className="bg-[#13131f] border border-white/[0.06] rounded-xl overflow-hidden">
          <ContactsTable
            data={data}
            loading={loading}
            onView={setDetailId}
            onDelete={(id, name) => setDeleteTarget({ id, name })}
          />
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      </div>

      {/* Modal: Novo contato */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Novo contato" description="Preencha as informações do contato">
        <ContactForm
          onSuccess={() => { setAddOpen(false); load(); show('Contato adicionado!') }}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>

      {/* Modal: Detalhe */}
      <Modal
        open={!!detailId}
        onClose={() => setDetailId(null)}
        title="Detalhes do contato"
        size="lg"
      >
        {detailId && (
          <ContactDetail
            contactId={detailId}
          />
        )}
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Excluir contato"
        description={`Deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />
    </AppLayout>
  )
}
