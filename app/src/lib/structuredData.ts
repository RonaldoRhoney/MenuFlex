import type { Business, BusinessHour } from './types'

// dayOfWeek de Date.getDay() (0=domingo...6=sábado) pros nomes que o
// schema.org espera em OpeningHoursSpecification.
const DIA_SCHEMA_ORG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Gera o JSON-LD (schema.org/Restaurant) que faz o Google mostrar
// "Aberto agora"/"Fecha às 23h" direto na busca, a partir do horário
// programado. Sem horário estruturado (usa_horario_programado = false), não
// dá pra declarar openingHoursSpecification de forma confiável — o toggle
// manual é só um estado momentâneo, não uma regra que o Google possa aplicar
// nos próximos dias — então omitimos o campo em vez de mentir pro Google.
export function buildBusinessJsonLd(business: Business, hours: BusinessHour[]) {
  const url = `${window.location.origin}/loja/${business.slug}`

  const openingHoursSpecification =
    business.usa_horario_programado && hours.length > 0
      ? hours
          .filter((h) => !h.closed && h.opens_at && h.closes_at)
          .map((h) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: DIA_SCHEMA_ORG[h.day_of_week],
            opens: h.opens_at,
            closes: h.closes_at,
          }))
      : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: business.name,
    url,
    ...(business.description && { description: business.description }),
    ...(business.logo_url && { image: business.logo_url }),
    ...(business.phone && { telephone: business.phone }),
    ...(business.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: business.address,
        ...(business.neighborhood && { addressLocality: business.neighborhood }),
        addressRegion: 'PA',
        addressCountry: 'BR',
      },
    }),
    ...(business.lat != null && business.lng != null && {
      geo: { '@type': 'GeoCoordinates', latitude: business.lat, longitude: business.lng },
    }),
    ...(openingHoursSpecification && { openingHoursSpecification }),
  }
}

const SCRIPT_ID = 'business-jsonld'

// Injeta/atualiza o <script type="application/ld+json"> no <head> — precisa
// ser feito em JS porque é uma SPA (não existe HTML estático por negócio).
// O Googlebot renderiza JS antes de indexar, então isso funciona normalmente.
export function setBusinessJsonLd(business: Business, hours: BusinessHour[]) {
  let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
  if (!script) {
    script = document.createElement('script')
    script.id = SCRIPT_ID
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(buildBusinessJsonLd(business, hours))
}

export function clearBusinessJsonLd() {
  document.getElementById(SCRIPT_ID)?.remove()
}
