import { useState, type ReactElement } from 'react'
import { useSearchParams } from 'react-router-dom'
import { signInWithPassword, signUpWithPassword, signInWithOAuth, type OAuthProvider } from '../../lib/auth'
import Splash from '../../components/Splash'

const OAUTH_PROVIDERS: { provider: OAuthProvider; label: string; icon: ReactElement }[] = [
  {
    provider: 'google',
    label: 'Google',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4.5 h-4.5">
        <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46c-.28 1.5-1.13 2.78-2.4 3.63v3.02h3.89c2.28-2.1 3.57-5.19 3.57-8.84z"/>
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.89-3.02c-1.08.72-2.45 1.15-4.04 1.15-3.1 0-5.73-2.1-6.67-4.92H1.3v3.1C3.26 21.3 7.3 24 12 24z"/>
        <path fill="#FBBC05" d="M5.33 14.31A7.2 7.2 0 0 1 4.96 12c0-.8.14-1.58.37-2.31V6.6H1.3A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.3 5.4l4.03-3.09z"/>
        <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.3 0 3.26 2.7 1.3 6.6l4.03 3.1c.94-2.83 3.57-4.93 6.67-4.93z"/>
      </svg>
    ),
  },
  {
    provider: 'facebook',
    label: 'Facebook',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="#1877F2">
        <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"/>
      </svg>
    ),
  },
]

export default function Login() {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<'login' | 'cadastro'>(
    searchParams.get('cadastro') ? 'cadastro' : 'login',
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null)
  const [signedUp, setSignedUp] = useState(false)
  const [showSplash, setShowSplash] = useState(true)

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

  async function handleOAuth(provider: OAuthProvider) {
    setError(null)
    setOauthLoading(provider)
    try {
      await signInWithOAuth(provider)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar')
      setOauthLoading(null)
    }
  }

  if (showSplash) return <Splash onContinue={() => setShowSplash(false)} />

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
          <>
            <div className="space-y-2.5 mb-5">
              {OAUTH_PROVIDERS.map(({ provider, label, icon }) => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => handleOAuth(provider)}
                  disabled={oauthLoading !== null}
                  className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-neutral-300 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  {icon}
                  {oauthLoading === provider ? 'Aguarde...' : `Continuar com ${label}`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-5">
              <span className="flex-1 h-px bg-neutral-200" />
              <span className="text-xs text-neutral-400">ou com e-mail</span>
              <span className="flex-1 h-px bg-neutral-200" />
            </div>
          </>
        )}

        {!signedUp && (
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
