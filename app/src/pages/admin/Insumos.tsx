import { useEffect, useState } from 'react'
import { checkPlanFeature } from '../../lib/planFeatures'
import { excluirInsumo, fetchInsumos, salvarInsumo } from '../../lib/insumos'
import type { Business, Insumo, PlanFeatureRow } from '../../lib/types'
import { SkeletonRow } from '../../components/Skeleton'
import EmptyState from '../../components/EmptyState'

interface InsumosProps {
  business: Business
  planFeatures: PlanFeatureRow[]
}

const inputClass = 'w-full border border-white/15 bg-slate-950 rounded-lg px-3 py-2 text-sm placeholder:text-white/30'

interface NovoInsumo {
  nome: string
  unidade: string
  categoria: string
  custo_unitario: string
  estoque_atual: string
  estoque_minimo: string
  fornecedor: string
  validade: string
}

const NOVO_VAZIO: NovoInsumo = {
  nome: '',
  unidade: '',
  categoria: '',
  custo_unitario: '',
  estoque_atual: '',
  estoque_minimo: '',
  fornecedor: '',
  validade: '',
}

export default function Insumos({ business, planFeatures }: InsumosProps) {
  const podeErp = checkPlanFeature(planFeatures, business.plan, 'gestao_erp')

  const [itens, setItens] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(true)
  const [novo, setNovo] = useState<NovoInsumo>(NOVO_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!podeErp) {
      setLoading(false)
      return
    }
    fetchInsumos(business.id).then((data) => {
      setItens(data)
      setLoading(false)
    })
  }, [business.id, podeErp])

  if (!podeErp) {
    return (
      <EmptyState
        title="Gestão de insumos disponível no plano Premium"
        description="Cadastre ingredientes, monte a ficha técnica dos pratos e veja custo/margem/lucro calculados automaticamente fazendo upgrade em Configurações."
      />
    )
  }

  async function criarInsumo(e: React.FormEvent) {
    e.preventDefault()
    if (!novo.nome.trim() || !novo.unidade.trim()) return
    setSalvando(true)
    setErro(null)
    try {
      const criado = await salvarInsumo(business.id, {
        nome: novo.nome.trim(),
        unidade: novo.unidade.trim(),
        categoria: novo.categoria.trim() || null,
        custo_unitario: Number(novo.custo_unitario) || 0,
        estoque_atual: Number(novo.estoque_atual) || 0,
        estoque_minimo: Number(novo.estoque_minimo) || 0,
        fornecedor: novo.fornecedor.trim() || null,
        lote: null,
        validade: novo.validade || null,
      })
      setItens((prev) => [...prev, criado].sort((a, b) => a.nome.localeCompare(b.nome)))
      setNovo(NOVO_VAZIO)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar insumo')
    } finally {
      setSalvando(false)
    }
  }

  async function editarCampo(insumo: Insumo, patch: Partial<Insumo>) {
    const atualizado = { ...insumo, ...patch }
    setItens((prev) => prev.map((i) => (i.id === insumo.id ? atualizado : i)))
    await salvarInsumo(business.id, patch, insumo.id)
  }

  async function apagar(id: string) {
    if (!confirm('Remover este insumo? Isso falha se ele estiver numa ficha técnica.')) return
    try {
      await excluirInsumo(id)
      setItens((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível remover — ele está em uso em alguma ficha técnica.')
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-2">
        <SkeletonRow />
        <SkeletonRow />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-semibold mb-1">Insumos</h2>
        <p className="text-xs text-white/40">
          Ingredientes, bebidas, embalagens e demais insumos. Use na ficha técnica dos itens do cardápio pra calcular
          custo, lucro e margem automaticamente.
        </p>
      </div>

      <form onSubmit={criarInsumo} className="border border-white/10 bg-slate-900 rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium">Novo insumo</p>
        <div className="grid grid-cols-2 gap-2.5">
          <input
            placeholder="Nome (ex: Pão de hambúrguer)"
            value={novo.nome}
            onChange={(e) => setNovo((n) => ({ ...n, nome: e.target.value }))}
            required
            className={`${inputClass} col-span-2`}
          />
          <input
            placeholder="Unidade (g, ml, un)"
            value={novo.unidade}
            onChange={(e) => setNovo((n) => ({ ...n, unidade: e.target.value }))}
            required
            className={inputClass}
          />
          <input
            placeholder="Categoria (opcional)"
            value={novo.categoria}
            onChange={(e) => setNovo((n) => ({ ...n, categoria: e.target.value }))}
            className={inputClass}
          />
          <input
            type="number"
            step="0.0001"
            placeholder="Custo por unidade (R$)"
            value={novo.custo_unitario}
            onChange={(e) => setNovo((n) => ({ ...n, custo_unitario: e.target.value }))}
            className={inputClass}
          />
          <input
            placeholder="Fornecedor (opcional)"
            value={novo.fornecedor}
            onChange={(e) => setNovo((n) => ({ ...n, fornecedor: e.target.value }))}
            className={inputClass}
          />
          <input
            type="number"
            placeholder="Estoque atual"
            value={novo.estoque_atual}
            onChange={(e) => setNovo((n) => ({ ...n, estoque_atual: e.target.value }))}
            className={inputClass}
          />
          <input
            type="number"
            placeholder="Estoque mínimo"
            value={novo.estoque_minimo}
            onChange={(e) => setNovo((n) => ({ ...n, estoque_minimo: e.target.value }))}
            className={inputClass}
          />
          <input
            type="date"
            value={novo.validade}
            onChange={(e) => setNovo((n) => ({ ...n, validade: e.target.value }))}
            className={`${inputClass} col-span-2`}
          />
        </div>
        {erro && <p className="text-xs text-red-400">{erro}</p>}
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-brand text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Adicionar insumo'}
        </button>
      </form>

      <div className="space-y-2">
        {itens.length === 0 && (
          <EmptyState title="Nenhum insumo cadastrado" description="Cadastre o primeiro insumo acima pra começar a montar fichas técnicas." />
        )}
        {itens.map((i) => (
          <div key={i.id} className="border border-white/10 bg-slate-900 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{i.nome}</p>
              <p className="text-xs text-white/40">
                {i.unidade} · R$ {i.custo_unitario.toFixed(4)}/{i.unidade}
                {i.fornecedor && ` · ${i.fornecedor}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                step="0.0001"
                value={i.custo_unitario}
                onChange={(e) => editarCampo(i, { custo_unitario: Number(e.target.value) || 0 })}
                className="w-20 text-center border border-white/15 bg-slate-950 rounded-lg py-1 text-xs"
                title="Custo por unidade"
              />
              <button onClick={() => apagar(i.id)} className="text-xs text-red-400/70 hover:text-red-400 px-2">
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
