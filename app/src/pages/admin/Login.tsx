import { useState } from 'react'
import { signInWithPassword, signUpWithPassword } from '../../lib/auth'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'cadastro'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [signedUp, setSignedUp] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        await signInWithPassword(email, password)
      } else {
        await signUpWithPassword(email, password)
        setSignedUp(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-center mb-1">MenuFlex</h1>
        <p className="text-sm text-neutral-500 text-center mb-8">Painel do negócio</p>

        {signedUp ? (
          <p className="text-sm text-center text-neutral-600">
            Cadastro criado! Confirme seu e-mail e depois entre para começar o onboarding do seu negócio.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand text-white py-2.5 font-medium disabled:opacity-50"
            >
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        )}

        {!signedUp && (
          <button
            onClick={() => setMode(mode === 'login' ? 'cadastro' : 'login')}
            className="w-full text-center text-sm text-brand-dark mt-4"
          >
            {mode === 'login' ? 'Não tem conta? Cadastre seu negócio' : 'Já tem conta? Entrar'}
          </button>
        )}
      </div>
    </div>
  )
}
