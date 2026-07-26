import { supabase } from './supabaseClient'
import { SITE_URL } from './referral'
import type { Business, CartItem, WhatsappConfig, WhatsappEventType } from './types'

export function getCardapioLink(business: Pick<Business, 'slug'>): string {
  return `${SITE_URL}/loja/${business.slug}`
}

// Normaliza qualquer formato de entrada ("(91) 99999-9999", "+55 91 99999-9999",
// "91999999999") para dígitos puros com DDI 55, formato exigido pelo wa.me.
export function normalizeWhatsappNumber(input: string): string {
  let digits = input.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = digits.replace(/^0+/, '')
  if (!digits.startsWith('55')) digits = `55${digits}`
  return digits
}

export function isValidWhatsappNumber(input: string): boolean {
  const digits = normalizeWhatsappNumber(input)
  return /^55\d{10,11}$/.test(digits)
}

export function buildWaMeLink(numero: string, mensagem: string): string {
  const digits = normalizeWhatsappNumber(numero)
  return `https://wa.me/${digits}?text=${encodeURIComponent(mensagem)}`
}

export function substituirPlaceholders(mensagem: string, business: Pick<Business, 'name'>, link?: string): string {
  return mensagem
    .replaceAll('{{Nome do Estabelecimento}}', business.name)
    .replaceAll('{{nome}}', business.name)
    .replaceAll('{{link}}', link ?? getCardapioLink(business as Business))
}

export async function fetchWhatsappConfig(businessId: string): Promise<WhatsappConfig | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('whatsapp_config').select('*').eq('business_id', businessId).maybeSingle()
  if (error) throw error
  return data as WhatsappConfig | null
}

export async function saveWhatsappConfig(businessId: string, config: Partial<WhatsappConfig>): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('whatsapp_config').upsert({ business_id: businessId, ...config })
  if (error) throw error
}

export async function trackWhatsappEvent(businessId: string, eventType: WhatsappEventType): Promise<void> {
  if (!supabase) return
  await supabase.from('whatsapp_events').insert({ business_id: businessId, event_type: eventType })
}

export async function fetchWhatsappStats(businessId: string): Promise<Record<WhatsappEventType, number>> {
  const base: Record<WhatsappEventType, number> = { click_send: 0, menu_sent: 0, share_click: 0 }
  if (!supabase) return base
  const { data, error } = await supabase.from('whatsapp_events').select('event_type').eq('business_id', businessId)
  if (error) throw error
  for (const row of data ?? []) {
    const tipo = row.event_type as WhatsappEventType
    base[tipo] = (base[tipo] ?? 0) + 1
  }
  return base
}

interface OrderSummaryInfo {
  items: CartItem[]
  total: number
  orderType: 'retirada' | 'delivery' | 'local'
  deliveryAddress: string
  customerName: string
  customerPhone: string
}

const ORDER_TYPE_LABEL: Record<OrderSummaryInfo['orderType'], string> = {
  retirada: 'Retirada',
  delivery: 'Entrega',
  local: 'Consumo no local',
}

export function buildOrderSummaryMessage(order: OrderSummaryInfo, business: Pick<Business, 'name'>): string {
  const itensBloco = order.items
    .map((item) => {
      const valor = (item.unit_price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      const detalhes = [item.options_summary, item.notes].filter(Boolean).join(' — ')
      return `✅ ${item.name}\nQuantidade: ${item.quantity}\nValor: ${valor}${detalhes ? `\nObservação: ${detalhes}` : ''}`
    })
    .join('\n\n')

  const total = order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const cabecalho = [
    `🛒 NOVO PEDIDO — ${business.name}`,
    `Cliente: ${order.customerName}`,
    `Telefone: ${order.customerPhone}`,
    `Tipo: ${ORDER_TYPE_LABEL[order.orderType]}`,
    ...(order.orderType === 'delivery' && order.deliveryAddress ? [`Endereço: ${order.deliveryAddress}`] : []),
  ].join('\n')

  return [cabecalho, 'Itens:', itensBloco, `TOTAL: ${total}`, 'Obrigado!'].join('\n\n')
}
