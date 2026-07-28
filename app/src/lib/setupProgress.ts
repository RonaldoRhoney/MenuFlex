import type { Business, MenuItem } from './types'

export interface Progresso {
  percentual: number
  faltando: string[]
}

// Campos opcionais (PIX, redes sociais) ficam de fora do cálculo, conforme
// o brief — só os campos considerados obrigatórios entram no percentual.
export function progressoEmpresa(business: Business, temDelivery: boolean): Progresso {
  const campos: [string, boolean][] = [
    ['Nome da empresa', !!business.name?.trim()],
    ['Categoria', !!business.type],
    // "Telefone / WhatsApp" é o mesmo campo `phone` editado em Minha Empresa
    // (whatsapp_number é outro campo, específico da aba Cardápio WhatsApp).
    ['WhatsApp', !!business.phone?.trim()],
    ['Endereço', !!business.address?.trim()],
    ['Cidade', !!business.city?.trim()],
    ['Estado', !!business.state?.trim()],
    ['Horário de funcionamento', business.usa_horario_programado || !!business.opening_hours?.trim()],
    ['Logo', !!business.logo_url],
    ['Descrição', !!business.description?.trim()],
  ]
  if (temDelivery) campos.push(['Taxa de entrega', business.delivery_fee !== null])

  const preenchidos = campos.filter(([, ok]) => ok)
  return {
    percentual: campos.length === 0 ? 100 : Math.round((preenchidos.length / campos.length) * 100),
    faltando: campos.filter(([, ok]) => !ok).map(([label]) => label),
  }
}

function itemCompleto(item: MenuItem): boolean {
  return !!item.name?.trim() && item.price > 0 && !!item.category_id && !!item.description?.trim() && !!item.image_url
}

export function progressoCardapio(items: MenuItem[]): Progresso {
  if (items.length === 0) return { percentual: 0, faltando: ['Cadastre ao menos um produto'] }
  const completos = items.filter(itemCompleto)
  const faltando = items.filter((i) => !itemCompleto(i)).map((i) => `Completar dados de "${i.name}"`)
  return {
    percentual: Math.round((completos.length / items.length) * 100),
    faltando,
  }
}
