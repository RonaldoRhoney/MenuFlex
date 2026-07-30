import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { fetchFichaTecnica, fetchInsumos, removerFichaTecnicaItem, salvarFichaTecnicaItem } from '../../lib/insumos'
import type { FichaTecnicaItem, Insumo, MenuItem } from '../../lib/types'
import { formatarReais } from '../../lib/format'

interface FichaTecnicaEditorProps {
  businessId: string
  menuItem: MenuItem
  onUpdated: (item: MenuItem) => void
}


// custo/margem em menu_items são calculados por trigger no banco
// (0021_insumos_ficha_tecnica.sql) — depois de qualquer mudança na receita,
// busca o item de novo pra pegar os valores já recalculados pelo Postgres.
async function refetchMenuItem(id: string): Promise<MenuItem | null> {
  if (!supabase) return null
  const { data } = await supabase.from('menu_items').select('*').eq('id', id).single()
  return (data as MenuItem) ?? null
}

export default function FichaTecnicaEditor({ businessId, menuItem, onUpdated }: FichaTecnicaEditorProps) {
  const [receita, setReceita] = useState<FichaTecnicaItem[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(true)
  const [novoInsumoId, setNovoInsumoId] = useState('')
  const [novaQuantidade, setNovaQuantidade] = useState('')

  async function reload() {
    const [receitaData, insumosData] = await Promise.all([fetchFichaTecnica(menuItem.id), fetchInsumos(businessId)])
    setReceita(receitaData)
    setInsumos(insumosData)
    setLoading(false)
  }

  useEffect(() => {
    reload()
  }, [menuItem.id])

  async function adicionarLinha() {
    if (!novoInsumoId || !novaQuantidade || Number(novaQuantidade) <= 0) return
    await salvarFichaTecnicaItem(menuItem.id, novoInsumoId, Number(novaQuantidade))
    setNovoInsumoId('')
    setNovaQuantidade('')
    await reload()
    const atualizado = await refetchMenuItem(menuItem.id)
    if (atualizado) onUpdated(atualizado)
  }

  async function removerLinha(id: string) {
    await removerFichaTecnicaItem(id)
    await reload()
    const atualizado = await refetchMenuItem(menuItem.id)
    if (atualizado) onUpdated(atualizado)
  }

  if (loading) {
    return <div className="px-3 pb-3 text-xs text-white/40">Carregando ficha técnica...</div>
  }

  const custo = menuItem.custo ?? 0
  const lucro = menuItem.price - custo
  const margem = menuItem.margem ?? 0

  return (
    <div className="px-3 pb-3 pt-1 border-t border-white/10 bg-black/20 space-y-3">
      {receita.length > 0 && (
        <div className="grid grid-cols-4 gap-2 bg-slate-900 rounded-lg p-3 border border-white/10 text-center">
          <div>
            <p className="text-xs text-white/40">Preço venda</p>
            <p className="text-sm font-medium">{formatarReais(menuItem.price)}</p>
          </div>
          <div>
            <p className="text-xs text-white/40">Custo</p>
            <p className="text-sm font-medium">{formatarReais(custo)}</p>
          </div>
          <div>
            <p className="text-xs text-white/40">Lucro</p>
            <p className={`text-sm font-medium ${lucro < 0 ? 'text-red-400' : 'text-green-400'}`}>{formatarReais(lucro)}</p>
          </div>
          <div>
            <p className="text-xs text-white/40">Margem</p>
            <p className={`text-sm font-medium ${margem < 0 ? 'text-red-400' : 'text-green-400'}`}>{margem.toFixed(2)}%</p>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {receita.map((linha) => (
          <div key={linha.id} className="flex items-center justify-between text-sm bg-slate-900 rounded-lg px-3 py-2 border border-white/10">
            <span>
              {linha.insumo?.nome} — {linha.quantidade} {linha.insumo?.unidade}
            </span>
            <button onClick={() => removerLinha(linha.id)} className="text-xs text-red-400">
              Remover
            </button>
          </div>
        ))}
        {receita.length === 0 && (
          <p className="text-xs text-white/40">
            Totalmente opcional — sem ficha técnica, o item continua vendável normalmente, só sem custo/margem
            calculados e sem baixa automática de estoque de insumo ao vender.
          </p>
        )}
      </div>

      {insumos.length === 0 ? (
        <p className="text-xs text-white/40">Cadastre insumos na aba "Insumos" pra poder montar a ficha técnica.</p>
      ) : (
        <div className="flex gap-2">
          <select
            value={novoInsumoId}
            onChange={(e) => setNovoInsumoId(e.target.value)}
            className="flex-1 border border-white/15 bg-slate-950 rounded-lg px-2 py-1.5 text-xs"
          >
            <option value="">Selecione o insumo</option>
            {insumos.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome} ({i.unidade})
              </option>
            ))}
          </select>
          <input
            value={novaQuantidade}
            onChange={(e) => setNovaQuantidade(e.target.value)}
            placeholder="Qtd"
            type="number"
            step="0.0001"
            className="w-20 border border-white/15 bg-slate-950 rounded-lg px-2 py-1.5 text-xs placeholder:text-white/30"
          />
          <button onClick={adicionarLinha} className="shrink-0 rounded-lg bg-brand text-white px-3 text-xs font-medium">
            Add
          </button>
        </div>
      )}
    </div>
  )
}
