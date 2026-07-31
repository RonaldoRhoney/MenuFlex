import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { checkPlanFeature } from '../../lib/planFeatures'
import { excluirInsumo, fetchInsumoUsoPorItem, fetchInsumos, salvarInsumo } from '../../lib/insumos'
import { fetchBusinessSegmentSlugs } from '../../lib/catalog'
import { SUGESTOES_POR_SEGMENTO, TODAS_SUGESTOES, type InsumoSugestao } from '../../lib/insumoSuggestions'
import { formatarDataHora, formatarReais } from '../../lib/format'
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

type Ordenacao = 'nome' | 'maior_custo' | 'menor_custo' | 'mais_utilizados' | 'recentes'

function deriveInsumoCor(i: Insumo): 'verde' | 'amarelo' | 'vermelho' {
  if (i.estoque_atual <= 0) return 'vermelho'
  if (i.estoque_atual <= i.estoque_minimo) return 'amarelo'
  return 'verde'
}

function KpiCard({ icone, label, value }: { icone: string; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3.5 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand" />
      <p className="text-xl font-semibold tabular-nums leading-tight">
        {icone} {value}
      </p>
      <p className="text-xs text-white/40 mt-0.5">{label}</p>
    </div>
  )
}

export default function Insumos({ business, planFeatures }: InsumosProps) {
  const podeErp = checkPlanFeature(planFeatures, business, 'gestao_erp')

  const [itens, setItens] = useState<Insumo[]>([])
  const [usoPorItem, setUsoPorItem] = useState<Record<string, string[]>>({})
  const [segmentos, setSegmentos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [novo, setNovo] = useState<NovoInsumo>(NOVO_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sugestaoAberta, setSugestaoAberta] = useState(false)

  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [filtroFornecedor, setFiltroFornecedor] = useState('todos')
  const [soEstoqueBaixo, setSoEstoqueBaixo] = useState(false)
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('nome')

  useEffect(() => {
    if (!podeErp) {
      setLoading(false)
      return
    }
    let active = true
    Promise.all([fetchInsumos(business.id), fetchInsumoUsoPorItem(business.id), fetchBusinessSegmentSlugs(business.id)]).then(
      ([insumosData, usoData, segmentosData]) => {
        if (!active) return
        setItens(insumosData)
        setUsoPorItem(usoData)
        setSegmentos(segmentosData)
        setLoading(false)
      },
    )

    if (!supabase) return
    // Sem isso, o estoque debitado automaticamente ao avançar um pedido pra
    // "Em preparo" (0024_baixa_estoque_ingrediente.sql) só aparecia aqui
    // depois de recarregar a página manualmente — mesmo padrão já usado em
    // Estoque.tsx.
    const channel = supabase
      .channel(`insumos-${business.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'insumos', filter: `business_id=eq.${business.id}` },
        () => {
          fetchInsumos(business.id).then((data) => active && setItens(data))
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase!.removeChannel(channel)
    }
  }, [business.id, podeErp])

  // Sugestões: prioriza o(s) segmento(s) do negócio; sem segmento cadastrado,
  // cai pra lista geral. Nunca obrigatório — só acelera o cadastro.
  const sugestoesDoSegmento = useMemo<InsumoSugestao[]>(() => {
    const lista = segmentos.length > 0 ? segmentos.flatMap((slug) => SUGESTOES_POR_SEGMENTO[slug] ?? []) : TODAS_SUGESTOES
    const nomesJaCadastrados = new Set(itens.map((i) => i.nome.trim().toLowerCase()))
    const semDuplicata = new Set<string>()
    return lista.filter((s) => {
      const chave = s.nome.toLowerCase()
      if (nomesJaCadastrados.has(chave) || semDuplicata.has(chave)) return false
      semDuplicata.add(chave)
      return true
    })
  }, [segmentos, itens])

  // Autocomplete do campo Nome — bate contra as sugestões E os insumos já
  // cadastrados, só pra digitação mais rápida (nome livre continua permitido).
  const sugestoesNome = useMemo<InsumoSugestao[]>(() => {
    const termo = novo.nome.trim().toLowerCase()
    if (termo.length < 2) return []
    return TODAS_SUGESTOES.filter((s) => s.nome.toLowerCase().includes(termo)).slice(0, 6)
  }, [novo.nome])

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

  async function adicionarSugestao(s: InsumoSugestao) {
    try {
      const criado = await salvarInsumo(business.id, {
        nome: s.nome,
        unidade: s.unidade,
        categoria: s.categoria,
        custo_unitario: 0,
        estoque_atual: 0,
        estoque_minimo: s.estoque_minimo,
        fornecedor: null,
        lote: null,
        validade: null,
      })
      setItens((prev) => [...prev, criado].sort((a, b) => a.nome.localeCompare(b.nome)))
    } catch {
      setErro('Não foi possível adicionar a sugestão. Tente de novo.')
    }
  }

  function preencherComSugestao(s: InsumoSugestao) {
    // Só completa o que ainda está vazio — nunda sobrescreve o que o
    // lojista já digitou, tudo continua livremente editável depois.
    setNovo((n) => ({
      ...n,
      nome: s.nome,
      unidade: n.unidade || s.unidade,
      categoria: n.categoria || s.categoria,
      estoque_minimo: n.estoque_minimo || String(s.estoque_minimo),
    }))
  }

  // Debounce por insumo — sem isso, digitar um valor de vários dígitos no
  // campo de estoque/custo disparava uma requisição de UPDATE por tecla.
  // Acumula (merge) o patch pendente em vez de substituir, senão editar
  // estoque e custo em sequência rápida perderia a primeira mudança.
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const patchesPendentes = useRef<Record<string, Partial<Insumo>>>({})

  function editarCampo(insumo: Insumo, patch: Partial<Insumo>) {
    const atualizado = { ...insumo, ...patch }
    setItens((prev) => prev.map((i) => (i.id === insumo.id ? atualizado : i)))
    patchesPendentes.current[insumo.id] = { ...patchesPendentes.current[insumo.id], ...patch }
    clearTimeout(debounceTimers.current[insumo.id])
    debounceTimers.current[insumo.id] = setTimeout(() => {
      const pendente = patchesPendentes.current[insumo.id]
      delete patchesPendentes.current[insumo.id]
      if (pendente) salvarInsumo(business.id, pendente, insumo.id)
    }, 500)
  }

  async function duplicar(insumo: Insumo) {
    try {
      const criado = await salvarInsumo(business.id, {
        nome: `${insumo.nome} (cópia)`,
        unidade: insumo.unidade,
        categoria: insumo.categoria,
        custo_unitario: insumo.custo_unitario,
        estoque_atual: 0,
        estoque_minimo: insumo.estoque_minimo,
        fornecedor: insumo.fornecedor,
        lote: null,
        validade: insumo.validade,
      })
      setItens((prev) => [...prev, criado].sort((a, b) => a.nome.localeCompare(b.nome)))
    } catch {
      setErro('Não foi possível duplicar o insumo. Tente de novo.')
    }
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
      <div className="max-w-4xl space-y-2">
        <SkeletonRow />
        <SkeletonRow />
      </div>
    )
  }

  // ---------- Dashboard ----------
  const valorTotalEstoque = itens.reduce((soma, i) => soma + i.estoque_atual * i.custo_unitario, 0)
  const estoqueBaixoCount = itens.filter((i) => deriveInsumoCor(i) !== 'verde').length
  const ultimaAtualizacao = itens.reduce<string | null>((max, i) => (!max || i.updated_at > max ? i.updated_at : max), null)

  // ---------- Filtros/ordenação ----------
  const categorias = Array.from(new Set(itens.map((i) => i.categoria).filter((c): c is string => !!c))).sort()
  const fornecedores = Array.from(new Set(itens.map((i) => i.fornecedor).filter((f): f is string => !!f))).sort()

  const visiveis = itens
    .filter((i) => filtroCategoria === 'todas' || i.categoria === filtroCategoria)
    .filter((i) => filtroFornecedor === 'todos' || i.fornecedor === filtroFornecedor)
    .filter((i) => !soEstoqueBaixo || deriveInsumoCor(i) !== 'verde')
    .sort((a, b) => {
      if (ordenacao === 'maior_custo') return b.custo_unitario - a.custo_unitario
      if (ordenacao === 'menor_custo') return a.custo_unitario - b.custo_unitario
      if (ordenacao === 'mais_utilizados') return (usoPorItem[b.id]?.length ?? 0) - (usoPorItem[a.id]?.length ?? 0)
      if (ordenacao === 'recentes') return b.updated_at.localeCompare(a.updated_at)
      return a.nome.localeCompare(b.nome)
    })

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="font-semibold mb-1">Insumos</h2>
        <p className="text-xs text-white/40">
          Ingredientes, bebidas, embalagens e demais insumos. Use na ficha técnica dos itens do cardápio pra calcular
          custo, lucro e margem automaticamente.
        </p>
      </div>

      {/* Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <KpiCard icone="📦" label="Total de insumos" value={itens.length} />
        <KpiCard icone="💰" label="Valor em estoque" value={formatarReais(valorTotalEstoque)} />
        <KpiCard icone="⚠️" label="Estoque baixo" value={estoqueBaixoCount} />
        <KpiCard icone="📈" label="Última atualização" value={ultimaAtualizacao ? formatarDataHora(ultimaAtualizacao) : '—'} />
      </div>

      {/* Sugestões inteligentes */}
      {sugestoesDoSegmento.length > 0 && (
        <div className="border border-white/10 bg-slate-900 rounded-xl p-4">
          <button
            onClick={() => setSugestaoAberta((v) => !v)}
            className="w-full flex items-center justify-between text-sm font-medium"
          >
            <span>✨ Sugestões para o seu negócio ({sugestoesDoSegmento.length})</span>
            <span className="text-white/40 text-xs">{sugestaoAberta ? 'Fechar' : 'Ver sugestões'}</span>
          </button>
          {sugestaoAberta && (
            <div className="flex flex-wrap gap-2 mt-3">
              {sugestoesDoSegmento.map((s) => (
                <button
                  key={s.nome}
                  onClick={() => adicionarSugestao(s)}
                  className="text-xs bg-brand/10 text-brand border border-brand/20 rounded-full px-3 py-1.5 font-medium hover:bg-brand/20 transition-colors active:scale-95"
                >
                  + {s.nome}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={criarInsumo} className="border border-white/10 bg-slate-900 rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium">Novo insumo</p>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="col-span-2 relative">
            <input
              placeholder="Nome (ex: Pão de hambúrguer)"
              value={novo.nome}
              onChange={(e) => setNovo((n) => ({ ...n, nome: e.target.value }))}
              required
              autoComplete="off"
              className={inputClass}
            />
            {sugestoesNome.length > 0 && novo.nome.trim() && (
              <div className="absolute z-10 mt-1 w-full bg-slate-950 border border-white/15 rounded-lg overflow-hidden shadow-lg">
                {sugestoesNome.map((s) => (
                  <button
                    key={s.nome}
                    type="button"
                    onClick={() => preencherComSugestao(s)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                  >
                    {s.nome} <span className="text-white/30 text-xs">· {s.unidade}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
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
          className="rounded-lg bg-brand text-white px-4 py-2 text-sm font-medium disabled:opacity-50 transition-transform active:scale-95"
        >
          {salvando ? 'Salvando...' : 'Adicionar insumo'}
        </button>
        <p className="text-[11px] text-white/30">Cadastro rápido: o formulário fica aberto depois de salvar, pra você seguir cadastrando em sequência.</p>
      </form>

      {/* Filtros */}
      {itens.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="text-xs bg-slate-900 border border-white/15 rounded-full px-3 py-1.5">
            <option value="todas">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {fornecedores.length > 0 && (
            <select value={filtroFornecedor} onChange={(e) => setFiltroFornecedor(e.target.value)} className="text-xs bg-slate-900 border border-white/15 rounded-full px-3 py-1.5">
              <option value="todos">Todos os fornecedores</option>
              {fornecedores.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setSoEstoqueBaixo((v) => !v)}
            className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
              soEstoqueBaixo ? 'bg-red-500/15 border-red-500/40 text-red-400' : 'bg-slate-900 border-white/15 text-white/60'
            }`}
          >
            🔴 Estoque baixo
          </button>
          <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value as Ordenacao)} className="text-xs bg-slate-900 border border-white/15 rounded-full px-3 py-1.5 ml-auto">
            <option value="nome">Ordenar: nome</option>
            <option value="maior_custo">Maior custo</option>
            <option value="menor_custo">Menor custo</option>
            <option value="mais_utilizados">Mais utilizados</option>
            <option value="recentes">Recentes</option>
          </select>
        </div>
      )}

      <div className="space-y-2.5">
        {itens.length === 0 && (
          <EmptyState title="Nenhum insumo cadastrado" description="Cadastre o primeiro insumo acima pra começar a montar fichas técnicas." />
        )}
        {itens.length > 0 && visiveis.length === 0 && (
          <EmptyState title="Nenhum insumo com esse filtro" description="Tente limpar os filtros acima." />
        )}
        {visiveis.map((i) => {
          const cor = deriveInsumoCor(i)
          const usados = usoPorItem[i.id] ?? []
          const corClasse = { verde: 'border-white/10', amarelo: 'border-amber-500/40 bg-amber-500/[0.04]', vermelho: 'border-red-500/40 bg-red-500/[0.05]' }[cor]
          const bolinha = { verde: '🟢', amarelo: '🟡', vermelho: '🔴' }[cor]
          return (
            <div key={i.id} className={`border ${corClasse} bg-slate-900 rounded-xl p-3.5 transition-all duration-200 hover:border-white/20`}>
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="min-w-0">
                  <p className="font-medium text-sm leading-snug break-words">
                    {bolinha} {i.nome}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {i.categoria && `${i.categoria} · `}
                    {i.fornecedor && `${i.fornecedor} · `}
                    atualizado {formatarDataHora(i.updated_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => duplicar(i)} title="Duplicar" className="text-xs text-white/40 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
                    Duplicar
                  </button>
                  <button onClick={() => apagar(i.id)} title="Remover" className="text-xs text-red-400/70 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors">
                    Remover
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-2">
                <div>
                  <span className="text-[10px] uppercase tracking-wide text-white/30 block mb-1">Estoque ({i.unidade})</span>
                  <input
                    type="number"
                    step="0.01"
                    value={i.estoque_atual}
                    onChange={(e) => editarCampo(i, { estoque_atual: Math.max(Number(e.target.value) || 0, 0) })}
                    className="w-full text-center border border-white/15 bg-slate-950 rounded-lg py-1.5 text-sm"
                    title="Debitado automaticamente ao vender itens com esse insumo na ficha técnica"
                  />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wide text-white/30 block mb-1">Custo/{i.unidade}</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={i.custo_unitario}
                    onChange={(e) => editarCampo(i, { custo_unitario: Number(e.target.value) || 0 })}
                    className="w-full text-center border border-white/15 bg-slate-950 rounded-lg py-1.5 text-sm"
                  />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wide text-white/30 block mb-1">Valor em estoque</span>
                  <p className="text-center border border-transparent py-1.5 text-sm font-medium tabular-nums">
                    {formatarReais(i.estoque_atual * i.custo_unitario)}
                  </p>
                </div>
              </div>

              {usados.length > 0 && (
                <p className="text-xs text-white/40">
                  Usado em: <span className="text-white/60">{usados.join(', ')}</span>
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
