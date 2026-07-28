import type { Business, Order, OrderType } from './types'

export type PeriodoExport = 'dia' | 'semana' | 'mes'

const LABEL_PERIODO: Record<PeriodoExport, string> = {
  dia: 'Hoje',
  semana: 'Últimos 7 dias',
  mes: 'Últimos 30 dias',
}

const LABEL_TIPO: Record<OrderType, string> = {
  retirada: 'Retirada',
  delivery: 'Delivery',
  local: 'No local',
}

// Mesmo critério de fuso fixo já usado em api/platform-summary.js e
// businessHours.ts — evita o bug de "pedido de ontem à noite contado como
// hoje" que já corrigimos no dashboard de métricas.
function diaBelem(isoString: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Belem', year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(isoString),
  )
}

export function filtrarPedidosPorPeriodo(orders: Order[], periodo: PeriodoExport): Order[] {
  const hoje = diaBelem(new Date().toISOString())
  const dias = periodo === 'dia' ? 1 : periodo === 'semana' ? 7 : 30
  const limite = new Date()
  limite.setDate(limite.getDate() - (dias - 1))
  const diaLimite = diaBelem(limite.toISOString())
  return orders.filter((o) => {
    const dia = diaBelem(o.created_at)
    return dia >= diaLimite && dia <= hoje
  })
}

function nomeArquivo(business: Business, periodo: PeriodoExport, ext: string) {
  const slug = business.name.replace(/\s+/g, '_')
  return `vendas-${slug}-${periodo}-${new Date().toISOString().slice(0, 10)}.${ext}`
}

export async function exportarVendasXlsx(business: Business, orders: Order[], periodo: PeriodoExport): Promise<void> {
  const writeExcelFile = (await import('write-excel-file/browser')).default
  const pedidos = filtrarPedidosPorPeriodo(orders, periodo)
  const total = pedidos.reduce((s, o) => s + (o.status === 'cancelado' ? 0 : o.total), 0)

  const sheetData = [
    [`Vendas — ${business.name} — ${LABEL_PERIODO[periodo]}`],
    ['Data/hora', 'Tipo', 'Status', 'Total (R$)'],
    ...pedidos.map((o) => [
      new Date(o.created_at).toLocaleString('pt-BR'),
      LABEL_TIPO[o.order_type],
      o.status,
      { value: o.total, format: '#,##0.00' },
    ]),
    ['', '', 'Total', { value: total, format: '#,##0.00' }],
  ]

  await writeExcelFile(sheetData as never).toFile(nomeArquivo(business, periodo, 'xlsx'))
}

export async function exportarVendasPdf(business: Business, orders: Order[], periodo: PeriodoExport): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const { autoTable } = await import('jspdf-autotable')
  const pedidos = filtrarPedidosPorPeriodo(orders, periodo)
  const total = pedidos.reduce((s, o) => s + (o.status === 'cancelado' ? 0 : o.total), 0)

  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text(`Vendas — ${business.name}`, 14, 16)
  doc.setFontSize(10)
  doc.text(LABEL_PERIODO[periodo], 14, 22)

  autoTable(doc, {
    startY: 28,
    head: [['Data/hora', 'Tipo', 'Status', 'Total (R$)']],
    body: pedidos.map((o) => [
      new Date(o.created_at).toLocaleString('pt-BR'),
      LABEL_TIPO[o.order_type],
      o.status,
      o.total.toFixed(2).replace('.', ','),
    ]),
    foot: [['', '', 'Total', total.toFixed(2).replace('.', ',')]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [249, 115, 22] },
  })

  doc.save(nomeArquivo(business, periodo, 'pdf'))
}
