import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase, DB_READY } from '../../lib/supabaseClient'
import { loadPlanFeatures, getPlanUsageLimit } from '../../lib/planFeatures'
import { useCart } from '../../lib/cart'
import { getCurrentPosition, isWithinRadius } from '../../lib/geo'
import { logConsent } from '../../lib/lgpd'
import { MOCK_BUSINESS, MOCK_CATEGORIES, MOCK_ITEMS, MOCK_PLAN_FEATURES } from '../../lib/mockData'
import type { Business, MenuCategory, MenuItem, PlanFeatureRow } from '../../lib/types'
import Cardapio from './Cardapio'
import MontarPedido from './MontarPedido'
import AcompanharPedido from './AcompanharPedido'
import Footer from '../../components/Footer'
import ConsentModal from '../../components/ConsentModal'

const GEO_CONSENT_KEY = 'menuflex_geo_consent_v1'

type View = 'cardapio' | 'pedido' | 'acompanhar'

export default function Loja() {
  const { slug } = useParams<{ slug: string }>()

  const [business, setBusiness] = useState<Business | null>(null)
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [planFeatures, setPlanFeatures] = useState<PlanFeatureRow[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [view, setView] = useState<View>('cardapio')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [orderTotal, setOrderTotal] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [showConsent, setShowConsent] = useState(false)
  const [showInstallHint, setShowInstallHint] = useState(false)

  const cart = useCart()

  useEffect(() => {
    if (!slug) return
    let active = true

    // Sem Supabase configurado (.env.local ausente — ver SETUP.md): usa o cardápio
    // fictício "Burger do Zé" pra dar pra demonstrar/testar o front sem banco.
    if (!DB_READY) {
      setBusiness(MOCK_BUSINESS)
      setPlanFeatures(MOCK_PLAN_FEATURES)
      setCategories(MOCK_CATEGORIES)
      setItems(MOCK_ITEMS)
      setLoading(false)
      return
    }

    async function load() {
      const [{ data: biz, error: bizError }, features] = await Promise.all([
        supabase!.from('businesses').select('*').eq('slug', slug).maybeSingle(),
        loadPlanFeatures(),
      ])
      if (!active) return
      if (bizError || !biz) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setBusiness(biz as Business)
      setPlanFeatures(features)

      const [{ data: cats }, { data: menuItems }] = await Promise.all([
        supabase!.from('menu_categories').select('*').eq('business_id', biz.id).order('order_index'),
        supabase!.from('menu_items').select('*').eq('business_id', biz.id).order('order_index'),
      ])
      if (!active) return
      setCategories((cats as MenuCategory[]) ?? [])
      setItems((menuItems as MenuItem[]) ?? [])
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [slug])

  // Prompt de instalação por proximidade — só pergunta consentimento se ainda
  // não perguntou nesse navegador, e só depois do cardápio já ter carregado.
  useEffect(() => {
    if (!business || loading) return
    const consent = localStorage.getItem(GEO_CONSENT_KEY)
    if (consent === null) {
      const timer = setTimeout(() => setShowConsent(true), 2500)
      return () => clearTimeout(timer)
    }
    if (consent === 'granted') {
      checkProximity()
    }
  }, [business, loading])

  async function checkProximity() {
    if (!business || business.lat === null || business.lng === null) return
    const radius = getPlanUsageLimit(planFeatures, business.plan, 'instalacao_proximidade')
    if (!radius) return
    try {
      const pos = await getCurrentPosition()
      const perto = isWithinRadius(pos.coords.latitude, pos.coords.longitude, business.lat, business.lng, radius)
      if (perto) setShowInstallHint(true)
    } catch {
      // usuário negou no navegador ou geolocalização indisponível — sem problema, segue sem o prompt
    }
  }

  async function handleAcceptConsent() {
    localStorage.setItem(GEO_CONSENT_KEY, 'granted')
    setShowConsent(false)
    await logConsent('geolocalizacao', true, business?.id)
    checkProximity()
  }

  async function handleDeclineConsent() {
    localStorage.setItem(GEO_CONSENT_KEY, 'denied')
    setShowConsent(false)
    await logConsent('geolocalizacao', false, business?.id)
  }

  async function handleSubmitOrder(params: {
    orderType: 'retirada' | 'delivery' | 'local'
    deliveryAddress: string
    name: string
    phone: string
  }) {
    if (!business) return
    setSubmitting(true)
    setErrorMessage(null)

    if (!DB_READY) {
      // Sem banco ainda: simula a criação do pedido localmente (ver AcompanharPedido `simulate`).
      await new Promise((resolve) => setTimeout(resolve, 500))
      setSubmitting(false)
      setOrderTotal(cart.total)
      setOrderId(crypto.randomUUID())
      cart.clear()
      setView('acompanhar')
      return
    }

    const { data, error } = await supabase!.rpc('create_order', {
      p_business_id: business.id,
      p_order_type: params.orderType,
      p_delivery_address: params.deliveryAddress || null,
      p_customer_name: params.name,
      p_customer_phone: params.phone,
      p_items: cart.items.map((i) => ({
        menu_item_id: i.menu_item_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        notes: [i.options_summary, i.notes].filter(Boolean).join(' — ') || null,
      })),
    })
    setSubmitting(false)
    if (error) {
      setErrorMessage(error.message)
      return
    }
    setOrderId(data as string)
    cart.clear()
    setView('acompanhar')
  }

  if (loading) return <div className="p-8 text-center text-neutral-400">Carregando cardápio...</div>
  if (notFound || !business) {
    return <div className="p-8 text-center text-neutral-500">Negócio não encontrado.</div>
  }

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1">
        {showInstallHint && (
          <div className="bg-brand text-white text-sm text-center py-2 px-4">
            Você está perto de {business.name}! Instale o app para pedir mais rápido da próxima vez.
          </div>
        )}

        {view === 'cardapio' && (
          <Cardapio
            business={business}
            categories={categories}
            items={items}
            onAdd={cart.add}
            cartCount={cart.items.reduce((n, i) => n + i.quantity, 0)}
            onOpenCart={() => setView('pedido')}
          />
        )}

        {view === 'pedido' && (
          <MontarPedido
            business={business}
            items={cart.items}
            total={cart.total}
            planFeatures={planFeatures}
            onSetQuantity={cart.setQuantity}
            onSetNotes={cart.setNotes}
            onBack={() => setView('cardapio')}
            onSubmit={handleSubmitOrder}
            submitting={submitting}
            errorMessage={errorMessage}
          />
        )}

        {view === 'acompanhar' && orderId && (
          <AcompanharPedido
            orderId={orderId}
            simulate={!DB_READY}
            simulatedTotal={orderTotal}
            onVoltarAoCardapio={() => setView('cardapio')}
          />
        )}
      </div>

      <ConsentModal open={showConsent} onAccept={handleAcceptConsent} onDecline={handleDeclineConsent} />
      <Footer />
    </div>
  )
}
