import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import logoTrivoxia from '@/assets/logo-trivoxia.png'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError('E-mail ou senha inválidos. Tente novamente.')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center p-4 animate-fadeIn">

      {/* Glows decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/[0.06] rounded-full blur-3xl" />
        <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-violet-500/[0.05] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px] flex flex-col items-center">

        {/* Logo + nome */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <img
            src={logoTrivoxia}
            alt="TrivoxIA"
            className="h-20 w-20 object-contain drop-shadow-lg"
          />
          <span
            className="text-3xl tracking-widest font-light text-[#9ca3af]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '0.18em' }}
          >
            TrivoxIA
          </span>
        </div>

        {/* Card glassmorphism */}
        <div className="w-full bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-xl p-8 shadow-2xl">

          <h2 className="text-xl font-bold text-white mb-1">Bem-vindo de volta</h2>
          <p className="text-sm text-[#9ca3af] mb-7">
            Entre com suas credenciais para acessar o painel
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* E-mail */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="contato@trivoxia.com"
                className="w-full rounded-lg bg-[#f0f0f0] px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-cyan-400/60 transition-all"
              />
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg bg-[#f0f0f0] px-3.5 py-3 pr-11 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-cyan-400/60 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-lg font-bold text-sm text-gray-900 disabled:opacity-60 transition-all"
              style={{ background: 'linear-gradient(90deg, #4dd0e1, #26c6da)' }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(0.88)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = '' }}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

          </form>
        </div>
      </div>

      {/* Footer */}
      <p className="absolute bottom-5 text-center text-[11px] text-zinc-700">
        © ® {new Date().getFullYear()} TrivoxIA — Todos os direitos reservados
      </p>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease both; }
      `}</style>
    </div>
  )
}
