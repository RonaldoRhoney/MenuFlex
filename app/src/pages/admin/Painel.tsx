import { useEffect, useState } from 'react'
import { useSession, consumeLoginIntent } from '../../lib/auth'
import { supabase } from '../../lib/supabaseClient'
import { loadPlanFeatures } from '../../lib/planFeatures'
import { fetchTrial, isTrialAtivo } from '../../lib/trial'
import TrialWelcomeModal from '../../components/admin/TrialWelcomeModal'
import TrialCountdownCard from '../../components/admin/TrialCountdownCard'
import { SUPER_ADMIN_EMAIL } from '../../lib/constants'
import type { Business, PlanFeatureRow } from '../../lib/types'
import Login from './Login'
import Onboarding from './Onboarding'
import CardapioAdmin from './Cardapio'
import PedidosGate from './PedidosGate'
import MinhaEmpresa from './MinhaEmpresa'
import Configuracoes from './Configuracoes'
import Analytics from './Analytics'
import Estoque from './Estoque'
import Insumos from './Insumos'
import Privacidade from './Privacidade'
import SuperAdmin from './SuperAdmin'
import CardapioWhatsapp from './CardapioWhatsapp'
import Splash from '../../components/Splash'
import { SkeletonScreen } from '../../components/Skeleton'
import AdminShell, {
  IconPedidos,
  IconEmpresa,
  IconCardapio,
  IconConfig,
  IconAnalytics,
  IconEstoque,
  IconInsumos,
  IconPrivacidade,
  IconGerencia,
  IconWhatsapp,
} from './AdminShell'

type Aba =
  | 'fila'
  | 'minha_empresa'
  | 'cardapio'
  | 'estoque'
  | 'insumos'
  | 'configuracoes'
  | 'analytics'
  | 'privacidade'
  | 'cardapio_whatsapp'
  | 'super_admin'

const ABAS = [
  { value: 'minha_empresa' as Aba, label: 'Minha Empresa', icon: <IconEmpresa /> },
  { value: 'cardapio' as Aba, label: 'Cardápio', icon: <IconCardapio /> },
  { value: 'fila' as Aba, label: 'Pedidos', icon: <IconPedidos /> },
  { value: 'estoque' as Aba, label: 'Estoque', icon: <IconEstoque /> },
  { value: 'insumos' as Aba, label: 'Insumos', icon: <IconInsumos /> },
  { value: 'cardapio_whatsapp' as Aba, label: 'Cardápio WhatsApp', icon: <IconWhatsapp /> },
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
  const [welcomeAberto, setWelcomeAberto] = useState(false)

  // Mesma animação de entrada do Splash (Login.tsx), agora também no login
  // bem-sucedido. A flag de intenção (sessionStorage, ver lib/auth.ts) —não
  // um estado em memória— é o que permite isso sobreviver ao redirect de
  // página inteira do login por Google/Facebook.
  const [justLoggedIn, setJustLoggedIn] = useState(false)

  useEffect(() => {
    if (sessionLoading) return
    if (session && consumeLoginIntent()) {
      setJustLoggedIn(true)
    }
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
      if (data) {
        const trial = await fetchTrial(data.id)
        if (!active) return
        setBusiness({ ...(data as Business), trial })
      } else {
        setBusiness(null)
      }
      setBusinessLoading(false)
      loadPlanFeatures().then((f) => active && setPlanFeatures(f))
    }
    load()
    return () => {
      active = false
    }
  }, [session?.user])

  // onUpdated (Minha Empresa/Configurações) devolve a linha crua do update,
  // sem o campo `trial` (que não é coluna de businesses, vem de trial_periods
  // à parte) — preserva o trial já carregado em vez de perdê-lo a cada save.
  function handleBusinessUpdated(atualizado: Business) {
    setBusiness((prev) => ({ ...atualizado, trial: prev?.trial ?? atualizado.trial }))
  }

  // Mostra a tela de boas-vindas do trial uma única vez por negócio — flag em
  // localStorage, não em coluna nova no banco, já que é só um "já vi isso".
  useEffect(() => {
    if (!business || !isTrialAtivo(business.trial)) return
    const chave = `menuflex_trial_welcome_visto_${business.id}`
    if (localStorage.getItem(chave) !== '1') {
      setWelcomeAberto(true)
      localStorage.setItem(chave, '1')
    }
  }, [business?.id, business?.trial])

  const splashOverlay = justLoggedIn && <Splash onContinue={() => setJustLoggedIn(false)} />

  if (sessionLoading || (session && businessLoading)) {
    return (
      <div className="relative min-h-dvh">
        {splashOverlay}
        <SkeletonScreen />
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
      <div className="relative min-h-dvh">
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
      <div className="relative min-h-dvh">
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
    <div className="relative min-h-dvh">
      {splashOverlay}
      <AdminShell
        title={business.name}
        subtitle={`Plano ${business.plan}`}
        email={session.user.email ?? undefined}
        abas={abas}
        aba={aba}
        onSelectAba={setAba}
        business={business}
        trialCard={
          business.trial && (
            <TrialCountdownCard
              businessId={business.id}
              trial={business.trial}
              onConhecerPlanos={() => setAba('configuracoes')}
            />
          )
        }
      >
        {aba === 'fila' && <PedidosGate business={business} planFeatures={planFeatures} onIrPara={setAba} />}
        {aba === 'minha_empresa' && (
          <MinhaEmpresa business={business} planFeatures={planFeatures} onUpdated={handleBusinessUpdated} />
        )}
        {aba === 'cardapio' && <CardapioAdmin business={business} planFeatures={planFeatures} />}
        {aba === 'estoque' && <Estoque business={business} planFeatures={planFeatures} />}
        {aba === 'insumos' && <Insumos business={business} planFeatures={planFeatures} />}
        {aba === 'cardapio_whatsapp' && <CardapioWhatsapp business={business} planFeatures={planFeatures} />}
        {aba === 'configuracoes' && <Configuracoes business={business} onUpdated={handleBusinessUpdated} />}
        {aba === 'analytics' && <Analytics business={business} planFeatures={planFeatures} />}
        {aba === 'privacidade' && <Privacidade />}
        {aba === 'super_admin' && isSuperAdmin && <SuperAdmin />}
      </AdminShell>
      {welcomeAberto && (
        <TrialWelcomeModal
          onClose={() => setWelcomeAberto(false)}
          onConhecerPlanos={() => {
            setWelcomeAberto(false)
            setAba('configuracoes')
          }}
        />
      )}
    </div>
  )
}
