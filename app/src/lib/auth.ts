import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return { session, loading }
}

// Marca a intenção de login antes de disparar a autenticação, e não um estado
// em memória (ex: useRef) — login por Google/Facebook navega a página inteira
// pra fora e de volta (signInWithOAuth redireciona), o que remonta o app do
// zero e apagaria qualquer coisa guardada só em memória. sessionStorage
// sobrevive a esse redirect (mesma aba), então Painel.tsx consegue saber, já
// remontado, que uma tentativa de login acabou de acontecer.
const LOGIN_INTENT_KEY = 'menuflex_login_intent'

export function markLoginIntent() {
  sessionStorage.setItem(LOGIN_INTENT_KEY, '1')
}

export function consumeLoginIntent(): boolean {
  const had = sessionStorage.getItem(LOGIN_INTENT_KEY) === '1'
  if (had) sessionStorage.removeItem(LOGIN_INTENT_KEY)
  return had
}

export async function signInWithPassword(email: string, password: string) {
  if (!supabase) throw new Error('Supabase não configurado')
  markLoginIntent()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signUpWithPassword(email: string, password: string) {
  if (!supabase) throw new Error('Supabase não configurado')
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
}

export type OAuthProvider = 'google' | 'facebook'

export async function signInWithOAuth(provider: OAuthProvider) {
  if (!supabase) throw new Error('Supabase não configurado')
  markLoginIntent()
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/admin` },
  })
  if (error) throw error
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}
