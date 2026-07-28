import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { checkPlanFeature } from '../../lib/planFeatures'
import type { Business, Order, OrderType, PlanFeatureRow } from '../../lib/types'
import { exportarVendasPdf, exportarVendasXlsx, type PeriodoExport } from '../../lib/salesExport'
import BarChart from '../../components/admin/BarChart'
import BarRank from '../../components/admin/BarRank'
import PieChart from '../../components/admin/PieChart'
import Heatmap from '../../components/admin/Heatmap'
import { SkeletonRow } from '../../components/Skeleton'
import EmptyState from '../../components/EmptyState'

interface AnalyticsProps {
  business: Business
  planFeatures: PlanFeatureRow[]
}

interface ProdutoVendido {
  menu_item_id: string
  nome: string
  quantidade: number
}

const LABEL_TIPO: Record<OrderType, string> = {
  retirada: 'Retirada',
  delivery: 'Delivery',
  local: 'No local',
}

const COR_TIPO: Record<OrderType, string> = {
  retirada: '#f97316',
  delivery: '#3b82f6',
  local: '#10b981',
}

function formatarReais(valor: number) {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`
}

function diasAtras(n: number): string[] {
  const out: string[] = []
  const hoje = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoje)
    d.setDate(hoje.getDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

function KpiCard({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 animate-fade-in">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent ? 'bg-brand' : 'bg-white/15'}`} />
      <p className={`text-xl font-semibold tabular-nums ${accent ? 'text-brand' : ''}`}>{value}</p>
      <p className="text-xs text-white/40 mt-0.5">{label}</p>
    </div>
  )
}

function Bloco({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-wide text-brand mb-2">{title}</h3>
      <div className="rounded-lg border border-white/10 bg-slate-900 p-3">{children}</div>
    </div>
  )
}

export default function Analytics({ business, planFeatures }: AnalyticsProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [produtos, setProdutos] = useState<ProdutoVendido[]>([])
  const [loading, setLoading] = useState(true)
  const [periodoExport, setPeriodoExport] = useState<PeriodoExport>('semana')
  const [exportando, setExportando] = useState<'xlsx' | 'pdf' | null>(null)

  const podeBasico = checkPlanFeature(planFeatures, business.plan, 'analytics_basico')
  const podeAvancado = checkPlanFeature(planFeatures, business.plan, 'analytics_avancado')
  const podeExportar = checkPlanFeature(planFeatures, business.plan, 'exportar_vendas')

  useEffect(() => {
    if (!supabase || !podeBasico) {
      setLoading(false)
      return
    }
    let active = true

    async function load() {
      const [ordersRes, itemsRes] = await Promise.all([
        supabase!.from('orders').select('*').eq('business_id', business.id),
        podeAvancado
          ? supabase!
              .from('order_items')
              .select('quantity, menu_item_id, menu_items(name), orders!inner(business_id)')
              .eq('orders.business_id', business.id)
          : Promise.resolve({ data: [] as any[] }),
      ])
      if (!active) return

      setOrders((ordersRes.data as Order[]) ?? [])

      const porProduto = new Map<string, ProdutoVendido>()
      for (const item of itemsRes.data ?? []) {
        const id = item.menu_item_id
        if (!id) continue
        const nome = item.menu_items?.name ?? 'Item removido'
        const atual = porProduto.get(id) ?? { menu_item_id: id, nome, quantidade: 0 }
        atual.quantidade += item.quantity
        porProduto.set(id, atual)
      }
      setProdutos(Array.from(porProduto.values()).sort((a, b) => b.quantidade - a.quantidade).slice(0, 8))
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [business.id, podeBasico, podeAvancado])

  if (!podeBasico) {
    return (
      <EmptyState
        title="Analytics disponível a partir do plano Básico"
        description="Acompanhe receita, pedidos e produtos mais vendidos fazendo upgrade em Configurações."
      />
    )
  }

  if (loading) {
    return (
      <div className="space-y-2 max-w-2xl">
        <SkeletonRow />
        <SkeletonRow />
      </div>
    )
  }

  function exportarCsv() {
    const header = ['id', 'data', 'tipo', 'status', 'total']
    const linhas = orders.map((o) => [o.id, new Date(o.created_at).toLocaleString('pt-BR'), o.order_type, o.status, o.total.toFixed(2)])
    const csv = [header, ...linhas].map((linha) => linha.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pedidos-${business.name.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleExportar(formato: 'xlsx' | 'pdf') {
    setExportando(formato)
    try {
      if (formato === 'xlsx') await exportarVendasXlsx(business, orders, periodoExport)
      else await exportarVendasPdf(business, orders, periodoExport)
    } finally {
      setExportando(null)
    }
  }

  const validos = orders.filter((o) => o.status !== 'cancelado')
  const totalPedidos = orders.length
  const faturamento = validos.reduce((sum, o) => sum + o.total, 0)
  const cancelados = orders.filter((o) => o.status === 'cancelado').length
  const clientesUnicos = new Set(orders.map((o) => o.customer_id).filter(Boolean)).size
  const ticketMedio = validos.length > 0 ? faturamento / validos.length : 0

  const dias14 = diasAtras(14)
  const faturamentoPorDia = dias14.map((dia) => ({
    dia,
    total: validos.filter((o) => o.created_at.slice(0, 10) === dia).reduce((s, o) => s + o.total, 0),
  }))

  const dias98 = diasAtras(98) // ~14 semanas, mesma janela do heatmap da Gerência
  const pedidosPorDiaHeatmap = dias98.map((dia) => ({
    dia,
    total: orders.filter((o) => o.created_at.slice(0, 10) === dia).length,
  }))

  const porHora = Array.from({ length: 24 }, (_, h) => ({
    dia: String(h).padStart(2, '0'),
    total: orders.filter((o) => new Date(o.created_at).getHours() === h).length,
  }))

  const tipos = (['retirada', 'delivery', 'local'] as OrderType[]).map((tipo) => ({
    label: LABEL_TIPO[tipo],
    value: orders.filter((o) => o.order_type === tipo).length,
    color: COR_TIPO[tipo],
  }))

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Analytics</h2>
        {orders.length > 0 && (
          <button
            onClick={exportarCsv}
            className="text-xs rounded-full border border-white/15 bg-slate-900 text-white/70 px-3 py-1.5 transition-transform active:scale-95 hover:border-white/25"
          >
            Exportar CSV
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <KpiCard label="Pedidos" value={totalPedidos} accent />
        <KpiCard label="Faturamento" value={formatarReais(faturamento)} accent />
        <KpiCard label="Clientes únicos" value={clientesUnicos} />
        <KpiCard label="Ticket médio" value={formatarReais(ticketMedio)} />
      </div>

      <Bloco title="Exportar vendas">
        {podeExportar ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              {(['dia', 'semana', 'mes'] as PeriodoExport[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodoExport(p)}
                  className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                    periodoExport === p ? 'bg-brand border-brand text-white' : 'border-white/15 text-white/60 hover:border-white/25'
                  }`}
                >
                  {p === 'dia' ? 'Dia' : p === 'semana' ? 'Semana' : 'Mês'}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExportar('xlsx')}
                disabled={exportando !== null || orders.length === 0}
                className="text-xs rounded-full border border-white/15 bg-slate-950 text-white/70 px-3 py-1.5 transition-transform active:scale-95 hover:border-white/25 disabled:opacity-50"
              >
                {exportando === 'xlsx' ? 'Gerando...' : 'Baixar XLSX'}
              </button>
              <button
                onClick={() => handleExportar('pdf')}
                disabled={exportando !== null || orders.length === 0}
                className="text-xs rounded-full border border-white/15 bg-slate-950 text-white/70 px-3 py-1.5 transition-transform active:scale-95 hover:border-white/25 disabled:opacity-50"
              >
                {exportando === 'pdf' ? 'Gerando...' : 'Baixar PDF'}
              </button>
            </div>
            {orders.length === 0 && <p className="text-xs text-white/40">Sem pedidos pra exportar ainda.</p>}
          </div>
        ) : (
          <p className="text-sm text-white/40">Exportação de vendas em PDF e XLSX disponível a partir do plano Básico.</p>
        )}
      </Bloco>

      <Bloco title="Faturamento · últimos 14 dias">
        <BarChart data={faturamentoPorDia} formatTooltip={(v) => formatarReais(v)} />
      </Bloco>

      {podeAvancado ? (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <Bloco title="Pedidos por tipo">
              <PieChart data={tipos} />
            </Bloco>
            <Bloco title="Produtos mais vendidos">
              {produtos.length === 0 ? (
                <p className="text-sm text-white/40 py-4 text-center">Sem vendas ainda.</p>
              ) : (
                <BarRank items={produtos.map((p) => ({ label: p.nome, total: p.quantidade }))} />
              )}
            </Bloco>
          </div>

          <Bloco title="Pedidos por hora do dia">
            <BarChart
              data={porHora}
              formatLabel={(h) => `${h}h`}
              formatTooltip={(v) => `${v} ${v === 1 ? 'pedido' : 'pedidos'}`}
            />
          </Bloco>

          <Bloco title="Mapa de calor de pedidos">
            <Heatmap data={pedidosPorDiaHeatmap} />
          </Bloco>

          <div className="flex justify-between text-sm px-1">
            <span className="text-white/50">Cancelados</span>
            <span className="text-white/70">{cancelados}</span>
          </div>
        </>
      ) : (
        <p className="text-sm text-white/40">
          Relatórios avançados (produtos mais vendidos, pedidos por hora, mapa de calor) disponíveis no Premium.
        </p>
      )}
    </div>
  )
}
