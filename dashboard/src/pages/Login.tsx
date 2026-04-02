import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff, Loader2, Sparkles } from 'lucide-react'
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
    <div
      style={{
        minHeight: '100vh',
        background: '#1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px 16px',
        position: 'relative',
      }}
      className="animate-fadeIn"
    >

      {/* Logo — CINZA, GRANDE */}
      <img
        src={logoTrivoxia}
        alt="TrivoxIA"
        style={{
          height: 100,
          width: 'auto',
          objectFit: 'contain',
          filter: 'grayscale(100%) brightness(0.6)',
        }}
      />

      {/* Nome "TrivoxIA" */}
      <span
        style={{
          marginTop: 16,
          fontSize: 52,
          color: '#6b7280',
          letterSpacing: '0.02em',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: 400,
          fontStyle: 'italic',
        }}
      >
        TrivoxIA
      </span>

      {/* Card de login */}
      <div
        style={{
          marginTop: 48,
          width: '100%',
          maxWidth: 420,
          padding: '32px 36px',
          background: 'rgba(38, 38, 42, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: 0 }}>
          Bem-vindo de volta
        </h2>
        <p style={{ fontSize: 14, color: '#9ca3af', marginTop: 6, marginBottom: 24 }}>
          Entre com suas credenciais para acessar o painel
        </p>

        <form onSubmit={handleSubmit}>

          {/* E-mail */}
          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="email"
              style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#e5e5e5', marginBottom: 8 }}
            >
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
              style={{
                width: '100%',
                height: 48,
                background: '#f5f5f5',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: 10,
                padding: '0 16px',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Senha */}
          <div style={{ marginBottom: 24 }}>
            <label
              htmlFor="password"
              style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#e5e5e5', marginBottom: 8 }}
            >
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••••••••"
                style={{
                  width: '100%',
                  height: 48,
                  background: '#f5f5f5',
                  color: '#1a1a1a',
                  border: 'none',
                  borderRadius: 10,
                  padding: '0 44px 0 16px',
                  fontSize: 15,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: '#6b7280',
                  display: 'flex',
                }}
              >
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          {/* Botao */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 10,
              border: 'none',
              background: '#4db6c5',
              color: '#1a1a1a',
              fontWeight: 600,
              fontSize: 16,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background 0.2s, opacity 0.2s',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget.style.background = '#3ea8b7') }}
            onMouseLeave={e => { if (!loading) (e.currentTarget.style.background = '#4db6c5') }}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p
        style={{
          marginTop: 'auto',
          paddingTop: 40,
          fontSize: 13,
          color: '#4b5563',
          textAlign: 'center',
        }}
      >
        {'© ® 2026 TrivoxIA — Todos os direitos reservados'}
      </p>

      {/* Sparkle icon bottom right */}
      <Sparkles 
        size={24} 
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          color: '#6b7280',
          opacity: 0.6,
        }}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease both; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}
