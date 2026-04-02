import { useEffect, useState, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import ContactsTable, { type ContactRow } from '@/components/contacts/ContactsTable'
import Modal from '@/components/shared/Modal'
import Pagination from '@/components/shared/Pagination'
import ChatView from '@/components/shared/ChatView'
import SearchBar from '@/components/shared/SearchBar'
import { api } from '@/lib/api'
import { Users, SortAsc, Clock } from 'lucide-react'

const PAGE_SIZE = 15

type SortMode = 'recent' | 'nome'

export default function Contacts() {

  const [data, setData]         = useState<ContactRow[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [sort, setSort]         = useState<SortMode>('recent')
  const [chatPhone, setChatPhone] = useState<string | null>(null)
  const [chatNome, setChatNome]   = useState<string>('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await api.getSdrContacts(page, PAGE_SIZE, search, sort)
      setData(result.data as ContactRow[])
      setTotal(result.total)
    } catch (e) {
      console.error('Erro ao carregar contatos', e)
    } finally {
      setLoading(false)
    }
  }, [page, search, sort])

  useEffect(() => { setPage(1) }, [search, sort])
  useEffect(() => { load() }, [load])

  function handleOpenChat(telefone: string) {
    const contact = data.find(r => r.telefone === telefone)
    setChatNome(contact?.nome ?? telefone)
    setChatPhone(telefone)
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-[1400px]">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Contatos</h1>
          <p className="text-zinc-400">Contatos únicos extraídos das conversas do WhatsApp</p>
        </div>

        {/* Top bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Users className="h-4 w-4" />
            <span>{total} contatos únicos</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort toggle */}
            <button
              onClick={() => setSort(s => s === 'recent' ? 'nome' : 'recent')}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 rounded-lg px-3 py-2 transition-colors"
            >
              {sort === 'recent'
                ? <><Clock className="h-3.5 w-3.5" /> Mais recentes</>
                : <><SortAsc className="h-3.5 w-3.5" /> Nome A–Z</>
              }
            </button>
          </div>
        </div>

        {/* Busca */}
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nome ou telefone..."
        />

        {/* Tabela */}
        <div className="bg-[#27272a] border border-zinc-700/50 rounded-xl overflow-hidden">
          <ContactsTable data={data} loading={loading} onView={handleOpenChat} />
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      </div>

      {/* Modal: Chat */}
      <Modal
        open={!!chatPhone}
        onClose={() => setChatPhone(null)}
        title={`Histórico — ${chatNome}`}
        size="xl"
      >
        {chatPhone && (
          <ChatView telefone={chatPhone} nome={chatNome} />
        )}
      </Modal>
    </AppLayout>
  )
}
