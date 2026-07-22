import { useEffect, useRef, useState } from 'react'
import { useSession } from '../../lib/auth'
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
import Splash from '../../components/Splash'
import AdminShell, {
  IconPedidos,
  IconEmpresa,
  IconCardapio,
  IconConfig,
  IconAnalytics,
  IconPrivacidade,
  IconGerencia,
} from './AdminShell'

type Aba = 'fila' | 'minha_empresa' | 'cardapio' | 'configuracoes' | 'analytics' | 'privacidade' | 'super_admin'

const ABAS = [
  { value: 'minha_empresa' as Aba, label: 'Minha Empresa', icon: <IconEmpresa /> },
  { value: 'cardapio' as Aba, label: 'Cardápio', icon: <IconCardapio /> },
  { value: 'fila' as Aba, label: 'Pedidos', icon: <IconPedidos /> },
  { value: 'analytics' as Aba, label: 'Analytics', icon: <IconAnalytics /> },
  { value: 'configuracoes' as Aba, label: 'Configurações', icon: <IconConfig /> },
  { value: 'privacidade' as Aba, label: 'Privacidade', icon: <IconPrivacidade /> },
]

export default function Painel() {
  const { session, loading: sessionLoading } = useSession()
  const [business, setBusiness] = useState<Business | null>(null)
  const [businessLoading, setBusinessLoading] = useState(true)
  const [planFeatures, setPlanFeatures] = useState<PlanFeatureRow[]>([])
  const [aba, setAba] = useState<Aba>('fila')

  // Mesma animação de entrada do Splash (Login.tsx) — mas disparada quando a
  // sessão passa de "sem sessão" pra "logado", não só na primeira tela antes
  // do login. hadSessionRef começa null (ainda não sabemos) pra não disparar
  // à toa quando a página carrega com uma sessão já existente (refresh).
  const [justLoggedIn, setJustLoggedIn] = useState(false)
  const hadSessionRef = useRef<boolean | null>(null)

  useEffect(() => {
    if (sessionLoading) return
    if (hadSessionRef.current === false && session) {
      setJustLoggedIn(true)
    }
    hadSessionRef.current = !!session
  }, [session, sessionLoading])

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

  const splashOverlay = justLoggedIn && <Splash onContinue={() => setJustLoggedIn(false)} />

  if (sessionLoading || (session && businessLoading)) {
    return (
      <div className="relative min-h-full">
        {splashOverlay}
        <div className="min-h-full flex items-center justify-center bg-slate-950 text-white/50 text-sm">Carregando...</div>
      </div>
    )
  }

  if (!session) return <Login />

  const isSuperAdmin = session.user.email === SUPER_ADMIN_EMAIL

  // A RhoneyInc (super-admin) gerencia a plataforma inteira — não é dona de
  // um negócio específico, então não faz sentido forçar ela a passar pelo
  // onboarding de "cadastre seu negócio" só pra acessar a Gerência.
  if (!business && isSuperAdmin) {
    return (
      <div className="relative min-h-full">
        {splashOverlay}
        <AdminShell
          title="RhoneyInc"
          subtitle="Gerência MenuFlex"
          abas={[{ value: 'super_admin', label: 'Gerência RhoneyInc', icon: <IconGerencia /> }]}
          aba="super_admin"
          onSelectAba={() => {}}
        >
          <SuperAdmin />
        </AdminShell>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="relative min-h-full">
        {splashOverlay}
        <Onboarding
          ownerId={session.user.id}
          onCreated={(novoNegocio) => {
            setBusiness(novoNegocio)
            loadPlanFeatures().then(setPlanFeatures)
          }}
        />
      </div>
    )
  }

  const abas = isSuperAdmin
    ? [...ABAS, { value: 'super_admin' as Aba, label: 'Gerência RhoneyInc', icon: <IconGerencia /> }]
    : ABAS

  return (
    <div className="relative min-h-full">
      {splashOverlay}
      <AdminShell
        title={business.name}
        subtitle={`Plano ${business.plan}`}
        abas={abas}
        aba={aba}
        onSelectAba={setAba}
      >
        {aba === 'fila' && <FilaPedidos business={business} />}
        {aba === 'minha_empresa' && (
          <MinhaEmpresa business={business} planFeatures={planFeatures} onUpdated={setBusiness} />
        )}
        {aba === 'cardapio' && <CardapioAdmin business={business} />}
        {aba === 'configuracoes' && <Configuracoes business={business} onUpdated={setBusiness} />}
        {aba === 'analytics' && <Analytics business={business} planFeatures={planFeatures} />}
        {aba === 'privacidade' && <Privacidade />}
        {aba === 'super_admin' && isSuperAdmin && <SuperAdmin />}
      </AdminShell>
    </div>
  )
}
