import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { checkPlanFeature } from '../../lib/planFeatures'
import { deriveEstoqueCor, fetchEstoque, salvarEstoqueItem, type EstoqueRow } from '../../lib/estoque'
import type { Business, PlanFeatureRow } from '../../lib/types'
import { SkeletonRow } from '../../components/Skeleton'
import EmptyState from '../../components/EmptyState'
import Tooltip from '../../components/Tooltip'

interface EstoqueProps {
  business: Business
  planFeatures: PlanFeatureRow[]
}

const FILTROS = [
  { value: 'todos', label: 'Todos' },
  { value: 'vermelho', label: '🔴 Faltando' },
  { value: 'amarelo', label: '🟡 Alerta' },
  { value: 'verde', label: '🟢 OK' },
] as const

const CORES = {
  vermelho: 'border-red-500/40 bg-red-500/[0.06]',
  amarelo: 'border-amber-500/40 bg-amber-500/[0.06]',
  verde: 'border-emerald-500/30 bg-emerald-500/[0.04]',
}

export default function Estoque({ business, planFeatures }: EstoqueProps) {
  const podeEstoque = checkPlanFeature(planFeatures, business, 'controle_estoque')

  const [itens, setItens] = useState<EstoqueRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]['value']>('todos')

  useEffect(() => {
    if (!podeEstoque) {
      setLoading(false)
      return
    }
    let active = true
    fetchEstoque(business.id).then((data) => {
      if (active) {
        setItens(data)
        setLoading(false)
      }
    })

    if (!supabase) return
    const channel = supabase
      .channel(`estoque-${business.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'estoque_itens', filter: `business_id=eq.${business.id}` },
        () => {
          fetchEstoque(business.id).then((data) => active && setItens(data))
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase!.removeChannel(channel)
    }
  }, [business.id, podeEstoque])

  if (!podeEstoque) {
    return (
      <div className="max-w-md border border-white/10 bg-slate-900 rounded-xl p-5">
        <h2 className="font-semibold mb-2">Controle de estoque</h2>
        <p className="text-sm text-white/40">
          Disponível a partir do plano Básico — faça upgrade em Configurações para liberar o mapa de calor de estoque
          e a personalização de identidade visual (logo própria).
        </p>
      </div>
    )
  }

  async function atualizarCampo(row: EstoqueRow, patch: Partial<Pick<EstoqueRow, 'estoque_atual' | 'estoque_minimo' | 'estoque_habilitado'>>) {
    const atualizado = { ...row, ...patch }
    setItens((prev) => prev.map((i) => (i.item_id === row.item_id ? atualizado : i)))
    await salvarEstoqueItem(business.id, row.item_id, patch)
  }

  if (loading) {
    return (
      <div className="max-w-md space-y-2">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    )
  }

  const habilitados = itens.filter((i) => i.estoque_habilitado)
  const contagem = {
    vermelho: habilitados.filter((i) => deriveEstoqueCor(i) === 'vermelho').length,
    amarelo: habilitados.filter((i) => deriveEstoqueCor(i) === 'amarelo').length,
    verde: habilitados.filter((i) => deriveEstoqueCor(i) === 'verde').length,
  }

  const visiveis = itens
    .filter((i) => (filtro === 'todos' ? true : i.estoque_habilitado && deriveEstoqueCor(i) === filtro))
    .sort((a, b) => {
      const ordem = { vermelho: 0, amarelo: 1, verde: 2 }
      const diff = ordem[deriveEstoqueCor(a)] - ordem[deriveEstoqueCor(b)]
      return diff !== 0 ? diff : a.menu_item.name.localeCompare(b.menu_item.name)
    })

  return (
    <div className="max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Estoque</h2>
        <p className="text-xs text-white/50">
          🔴 {contagem.vermelho} · 🟡 {contagem.amarelo} · 🟢 {contagem.verde}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`text-xs rounded-full px-3 py-1.5 border ${
              filtro === f.value ? 'bg-brand border-brand text-white' : 'border-white/15 bg-slate-900 text-white/70'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {visiveis.length === 0 && (
          <EmptyState
            title="Nenhum item aqui"
            description={filtro === 'todos' ? 'Cadastre itens no Cardápio pra começar a controlar o estoque.' : 'Nada com esse status no momento.'}
          />
        )}
        {visiveis.map((row) => {
          const cor = deriveEstoqueCor(row)
          return (
            <div key={row.item_id} className={`border rounded-xl p-3 ${row.estoque_habilitado ? CORES[cor] : 'border-white/10 bg-slate-900'}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm">{row.menu_item.name}</p>
                <label className="flex items-center gap-1.5 text-xs text-white/50">
                  <input
                    type="checkbox"
                    checked={row.estoque_habilitado}
                    onChange={(e) => atualizarCampo(row, { estoque_habilitado: e.target.checked })}
                  />
                  Controlar
                </label>
              </div>

              {row.estoque_habilitado && (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <Tooltip label="Diminuir 1 unidade">
                      <button
                        onClick={() => atualizarCampo(row, { estoque_atual: Math.max(row.estoque_atual - 1, 0) })}
                        className="w-8 h-8 rounded-lg border border-white/15 bg-slate-950 text-sm font-medium active:scale-90 transition-transform"
                      >
                        −
                      </button>
                    </Tooltip>
                    <input
                      type="number"
                      value={row.estoque_atual}
                      onChange={(e) => atualizarCampo(row, { estoque_atual: Math.max(Number(e.target.value) || 0, 0) })}
                      className="w-16 text-center border border-white/15 bg-slate-950 rounded-lg py-1 text-sm"
                    />
                    <Tooltip label="Aumentar 1 unidade">
                      <button
                        onClick={() => atualizarCampo(row, { estoque_atual: row.estoque_atual + 1 })}
                        className="w-8 h-8 rounded-lg border border-white/15 bg-slate-950 text-sm font-medium active:scale-90 transition-transform"
                      >
                        +
                      </button>
                    </Tooltip>
                    {cor === 'vermelho' && (
                      <span className="text-xs text-red-400 ml-1">Esgotado · marcado como indisponível</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <span>Alerta quando ≤</span>
                    <input
                      type="number"
                      value={row.estoque_minimo}
                      onChange={(e) => atualizarCampo(row, { estoque_minimo: Math.max(Number(e.target.value) || 0, 0) })}
                      className="w-14 text-center border border-white/15 bg-slate-950 rounded-lg py-1"
                    />
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
