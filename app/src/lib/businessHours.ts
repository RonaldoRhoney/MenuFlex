import { supabase } from './supabaseClient'
import type { BusinessHour } from './types'

export const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export async function fetchBusinessHours(businessId: string): Promise<BusinessHour[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('business_hours')
    .select('*')
    .eq('business_id', businessId)
    .order('day_of_week')
  return (data as BusinessHour[]) ?? []
}

// Substitui as 7 linhas de uma vez — mais simples que fazer upsert linha a
// linha, e o dono sempre edita a semana inteira na mesma tela.
export async function saveBusinessHours(businessId: string, hours: Omit<BusinessHour, 'business_id'>[]) {
  if (!supabase) return
  await supabase.from('business_hours').delete().eq('business_id', businessId)
  await supabase.from('business_hours').insert(hours.map((h) => ({ ...h, business_id: businessId })))
}

// "Agora" no fuso do negócio (Belém-PA, mesmo padrão do LiveClock) — Brasil
// não tem horário de verão hoje, então essa conversão simples é estável.
function agoraEmBelem(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Belem' }))
}

function periodoAbrange(hour: BusinessHour | undefined, minutosAgora: number, mesmoDia: boolean): boolean {
  if (!hour || hour.closed || !hour.opens_at || !hour.closes_at) return false
  const [oh, om] = hour.opens_at.split(':').map(Number)
  const [ch, cm] = hour.closes_at.split(':').map(Number)
  const abre = oh * 60 + om
  const fecha = ch * 60 + cm
  if (fecha > abre) {
    // período não cruza a meia-noite — só vale no próprio dia
    return mesmoDia && minutosAgora >= abre && minutosAgora < fecha
  }
  // período cruza a meia-noite (ex: 18:00–02:00): hoje à noite (depois de
  // abrir) OU de madrugada, ainda dentro do período que começou ontem.
  return mesmoDia ? minutosAgora >= abre : minutosAgora < fecha
}

export function isOpenNow(hours: BusinessHour[]): boolean {
  if (hours.length === 0) return true // sem horário cadastrado ainda — não bloqueia o cardápio
  const agora = agoraEmBelem()
  const dia = agora.getDay()
  const ontem = (dia + 6) % 7
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes()

  const hoje = hours.find((h) => h.day_of_week === dia)
  const deOntem = hours.find((h) => h.day_of_week === ontem)

  return periodoAbrange(hoje, minutosAgora, true) || periodoAbrange(deOntem, minutosAgora, false)
}
