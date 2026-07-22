import { supabase } from './supabaseClient'
import type { Segment, MenuItemCatalogEntry, MenuCategory, BusinessType } from './types'

export async function fetchSegments(): Promise<Segment[]> {
  if (!supabase) return []
  const { data } = await supabase.from('segments').select('*').eq('active', true).order('order_index')
  return (data as Segment[]) ?? []
}

export async function fetchBusinessSegmentIds(businessId: string): Promise<string[]> {
  if (!supabase) return []
  const { data } = await supabase.from('business_segments').select('segment_id').eq('business_id', businessId)
  return (data ?? []).map((r) => r.segment_id as string)
}

export async function saveBusinessSegments(businessId: string, segmentIds: string[]) {
  if (!supabase || segmentIds.length === 0) return
  await supabase
    .from('business_segments')
    .insert(segmentIds.map((segment_id) => ({ business_id: businessId, segment_id })))
}

export async function fetchCatalogBySegments(segmentIds: string[]): Promise<MenuItemCatalogEntry[]> {
  if (!supabase || segmentIds.length === 0) return []
  const { data } = await supabase
    .from('menu_item_catalog')
    .select('*')
    .in('segment_id', segmentIds)
    .order('usage_count', { ascending: false })
  return (data as MenuItemCatalogEntry[]) ?? []
}

// Enum legado (businesses.type) — mantido só por compatibilidade (coluna NOT
// NULL com check constraint, ver 0001_schema.sql). business_segments é a fonte
// de verdade real a partir daqui; isto só acha o melhor encaixe no enum antigo
// pra não quebrar a constraint existente.
const SEGMENT_SLUG_TO_LEGACY_TYPE: Record<string, BusinessType> = {
  lanchonete: 'lanche_rua',
  bar: 'bar',
  restaurante: 'restaurante',
  hamburgueria: 'hamburgueria',
}

export function legacyTypeFromSegmentSlugs(slugs: string[]): BusinessType {
  for (const slug of slugs) {
    const mapped = SEGMENT_SLUG_TO_LEGACY_TYPE[slug]
    if (mapped) return mapped
  }
  return 'outro'
}

export interface CatalogSelection {
  catalogId: string
  price: number
}

// Publica os itens marcados: cria categorias que ainda não existem no negócio
// (usando category_hint como nome) e copia os itens escolhidos pra
// menu_items, com veio_do_catalogo=true + origem_catalogo_id — cópia, não
// vínculo vivo (mudança futura no catálogo global não afeta o que já foi
// publicado).
export async function publishCatalogSelections(
  businessId: string,
  catalogItems: MenuItemCatalogEntry[],
  existingCategories: MenuCategory[],
  selections: CatalogSelection[],
): Promise<void> {
  if (!supabase || selections.length === 0) return

  const byId = new Map(catalogItems.map((c) => [c.id, c]))
  const neededCategoryNames = Array.from(
    new Set(
      selections
        .map((s) => byId.get(s.catalogId)?.category_hint)
        .filter((name): name is string => !!name),
    ),
  )

  const existingNames = new Set(existingCategories.map((c) => c.name))
  const missingNames = neededCategoryNames.filter((name) => !existingNames.has(name))

  let categories = existingCategories
  if (missingNames.length > 0) {
    const { data: created } = await supabase
      .from('menu_categories')
      .insert(
        missingNames.map((name, i) => ({
          business_id: businessId,
          name,
          order_index: existingCategories.length + i,
        })),
      )
      .select()
    categories = [...existingCategories, ...((created as MenuCategory[]) ?? [])]
  }

  const categoryIdByName = new Map(categories.map((c) => [c.name, c.id]))

  const rows = selections
    .map((s) => {
      const item = byId.get(s.catalogId)
      if (!item) return null
      const categoryId = item.category_hint ? categoryIdByName.get(item.category_hint) ?? null : null
      return {
        business_id: businessId,
        category_id: categoryId,
        name: item.name,
        description: item.description,
        price: s.price,
        image_url: item.image_url,
        origem_catalogo_id: item.id,
        veio_do_catalogo: true,
        order_index: 0,
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  if (rows.length > 0) {
    await supabase.from('menu_items').insert(rows)
  }
}
