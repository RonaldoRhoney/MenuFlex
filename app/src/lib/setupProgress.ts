import type { Business, EstoqueItem, Insumo, MenuItem } from './types'

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

const LIMIAR_LIBERACAO = 75

// "Estoque" (Módulo 3) só entra como requisito se o negócio já começou a
// usar insumos — quem nunca mexeu nisso (a maioria hoje, é feature Premium)
// não fica bloqueado por uma feature que nunca ativou.
export function progressoEstoque(insumos: Insumo[]): Progresso {
  if (insumos.length === 0) return { percentual: 100, faltando: [] }
  const completos = insumos.filter((i) => !!i.nome?.trim() && !!i.unidade?.trim())
  return {
    percentual: Math.round((completos.length / insumos.length) * 100),
    faltando: insumos.filter((i) => !i.nome?.trim() || !i.unidade?.trim()).map((i) => `Completar insumo "${i.nome || '(sem nome)'}"`),
  }
}

// Ficha técnica só é obrigatória pra itens com controle de estoque ligado
// (estoque_habilitado) — mesmo critério condicional do brief ("quando o
// produto utiliza controle de estoque").
export function itensSemFichaObrigatoria(
  items: MenuItem[],
  estoqueItens: EstoqueItem[],
  qtdFichaPorItem: Record<string, number>,
): string[] {
  const habilitados = new Set(estoqueItens.filter((e) => e.estoque_habilitado).map((e) => e.item_id))
  return items.filter((i) => habilitados.has(i.id) && !qtdFichaPorItem[i.id]).map((i) => i.name)
}

export interface AvaliacaoPedidos {
  liberado: boolean
  pendencias: string[]
}

// Combina os 4 módulos do Módulo 5 do brief num único veredito — usado só
// pra liberar/bloquear a ABA Pedidos do admin (nunca o create_order() do
// cliente final, que continua funcionando normalmente pra não perder venda).
export function avaliarPedidosLiberados(params: {
  empresa: Progresso
  cardapio: Progresso
  estoque: Progresso
  itensSemFicha: string[]
}): AvaliacaoPedidos {
  const pendencias: string[] = []
  if (params.empresa.percentual < LIMIAR_LIBERACAO) pendencias.push(`Completar cadastro da empresa (${params.empresa.percentual}%)`)
  if (params.cardapio.percentual < LIMIAR_LIBERACAO) pendencias.push(`Completar cardápio (${params.cardapio.percentual}%)`)
  if (params.estoque.percentual < LIMIAR_LIBERACAO) pendencias.push(`Completar estoque (${params.estoque.percentual}%)`)
  for (const nome of params.itensSemFicha) pendencias.push(`Completar ficha técnica de "${nome}"`)

  return { liberado: pendencias.length === 0, pendencias }
}
