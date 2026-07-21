import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession, signOut } from '../../lib/auth'
import { supabase } from '../../lib/supabaseClient'
import { loadPlanFeatures } from '../../lib/planFeatures'
import { SUPER_ADMIN_EMAIL } from '../../lib/constants'
import type { Business, PlanFeatureRow } from '../../lib/types'
import Login from './Login'
import Onboarding from './Onboarding'
import CardapioAdmin from './Cardapio'
import FilaPedidos from './FilaPedidos'
import MinhaEmpresa from './MinhaEmpresa'
import Configuracoes from './Configuracoes'
import Analytics from './Analytics'
import Privacidade from './Privacidade'
import SuperAdmin from './SuperAdmin'

type Aba = 'fila' | 'minha_empresa' | 'cardapio' | 'configuracoes' | 'analytics' | 'privacidade' | 'super_admin'

const ABAS: { value: Aba; label: string }[] = [
  { value: 'fila', label: 'Pedidos' },
  { value: 'minha_empresa', label: 'Minha Empresa' },
  { value: 'cardapio', label: 'Cardápio' },
  { value: 'configuracoes', label: 'Configurações' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'privacidade', label: 'Privacidade' },
]

export default function Painel() {
  const { session, loading: sessionLoading } = useSession()
  const [business, setBusiness] = useState<Business | null>(null)
  const [businessLoading, setBusinessLoading] = useState(true)
  const [planFeatures, setPlanFeatures] = useState<PlanFeatureRow[]>([])
  const [aba, setAba] = useState<Aba>('fila')

  useEffect(() => {
    if (!supabase || !session?.user) {
      setBusinessLoading(false)
      return
    }
    let active = true
    async function load() {
      const { data } = await supabase!
        .from('businesses')
        .select('*')
        .eq('owner_id', session!.user.id)
        .maybeSingle()
      if (!active) return
      setBusiness(data as Business | null)
      setBusinessLoading(false)
      loadPlanFeatures().then((f) => active && setPlanFeatures(f))
    }
    load()
    return () => {
      active = false
    }
  }, [session?.user])

  if (sessionLoading || (session && businessLoading)) {
    return <div className="p-8 text-center text-neutral-400">Carregando...</div>
  }

  if (!session) return <Login />

  const isSuperAdmin = session.user.email === SUPER_ADMIN_EMAIL

  // A RhoneyInc (super-admin) gerencia a plataforma inteira — não é dona de
  // um negócio específico, então não faz sentido forçar ela a passar pelo
  // onboarding de "cadastre seu negócio" só pra acessar a Gerência.
  if (!business && isSuperAdmin) {
    return (
      <div className="min-h-full flex flex-col">
        <header className="border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-semibold">RhoneyInc — Gerência MenuFlex</h1>
            <nav className="flex gap-3 mt-1">
              <Link to="/" className="text-xs text-neutral-500 hover:text-brand-dark">
                ← Página inicial
              </Link>
              <Link to="/parceiros" className="text-xs text-neutral-500 hover:text-brand-dark">
                Parceiros
              </Link>
            </nav>
          </div>
          <button onClick={signOut} className="text-sm text-neutral-500">
            Sair
          </button>
        </header>
        <main className="flex-1 p-4">
          <SuperAdmin />
        </main>
      </div>
    )
  }

  if (!business) {
    return (
      <Onboarding
        ownerId={session.user.id}
        onCreated={(novoNegocio) => {
          setBusiness(novoNegocio)
          loadPlanFeatures().then(setPlanFeatures)
        }}
      />
    )
  }

  const abas = isSuperAdmin ? [...ABAS, { value: 'super_admin' as Aba, label: 'Gerência RhoneyInc' }] : ABAS

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-semibold">{business.name}</h1>
          <p className="text-xs text-neutral-500">Plano {business.plan}</p>
        </div>
        <button onClick={signOut} className="text-sm text-neutral-500">
          Sair
        </button>
      </header>

      <nav className="flex gap-1 px-4 py-2 overflow-x-auto border-b border-neutral-200">
        {abas.map((a) => (
          <button
            key={a.value}
            onClick={() => setAba(a.value)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-sm ${
              aba === a.value ? 'bg-brand text-white' : 'text-neutral-600'
            }`}
          >
            {a.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 p-4">
        {aba === 'fila' && <FilaPedidos business={business} />}
        {aba === 'minha_empresa' && (
          <MinhaEmpresa business={business} planFeatures={planFeatures} onUpdated={setBusiness} />
        )}
        {aba === 'cardapio' && <CardapioAdmin business={business} />}
        {aba === 'configuracoes' && <Configuracoes business={business} onUpdated={setBusiness} />}
        {aba === 'analytics' && <Analytics business={business} planFeatures={planFeatures} />}
        {aba === 'privacidade' && <Privacidade />}
        {aba === 'super_admin' && isSuperAdmin && <SuperAdmin />}
      </main>
    </div>
  )
}
