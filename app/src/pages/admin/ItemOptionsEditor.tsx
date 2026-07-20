import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

interface Choice {
  id: string
  name: string
  price_delta: number
  order_index: number
}

interface Group {
  id: string
  name: string
  required: boolean
  multiple: boolean
  order_index: number
  menu_item_options: Choice[]
}

interface ItemOptionsEditorProps {
  menuItemId: string
}

// Editor de grupos de opção de um item (ex.: "Ponto da carne", "Adicionais") —
// mesmas tabelas que o ItemOptionsModal do cliente já lê (menu_item_option_groups
// + menu_item_options, migration 0003_item_options.sql). Antes desse componente
// existir, essas tabelas nunca eram populadas por um negócio real.
export default function ItemOptionsEditor({ menuItemId }: ItemOptionsEditorProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupRequired, setNewGroupRequired] = useState(false)
  const [newGroupMultiple, setNewGroupMultiple] = useState(false)
  const [newChoice, setNewChoice] = useState<Record<string, { name: string; price_delta: string }>>({})

  async function reload() {
    if (!supabase) return
    const { data } = await supabase
      .from('menu_item_option_groups')
      .select('id, name, required, multiple, order_index, menu_item_options(id, name, price_delta, order_index)')
      .eq('menu_item_id', menuItemId)
      .order('order_index')
    setGroups((data as unknown as Group[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    reload()
  }, [menuItemId])

  async function addGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase || !newGroupName.trim()) return
    await supabase.from('menu_item_option_groups').insert({
      menu_item_id: menuItemId,
      name: newGroupName.trim(),
      required: newGroupRequired,
      multiple: newGroupMultiple,
      order_index: groups.length,
    })
    setNewGroupName('')
    setNewGroupRequired(false)
    setNewGroupMultiple(false)
    reload()
  }

  async function deleteGroup(id: string) {
    if (!supabase) return
    await supabase.from('menu_item_option_groups').delete().eq('id', id)
    reload()
  }

  async function addChoice(groupId: string) {
    if (!supabase) return
    const draft = newChoice[groupId]
    if (!draft?.name.trim()) return
    const group = groups.find((g) => g.id === groupId)
    await supabase.from('menu_item_options').insert({
      group_id: groupId,
      name: draft.name.trim(),
      price_delta: Number(draft.price_delta) || 0,
      order_index: group?.menu_item_options.length ?? 0,
    })
    setNewChoice({ ...newChoice, [groupId]: { name: '', price_delta: '' } })
    reload()
  }

  async function deleteChoice(id: string) {
    if (!supabase) return
    await supabase.from('menu_item_options').delete().eq('id', id)
    reload()
  }

  if (loading) {
    return <div className="px-3 pb-3 text-xs text-neutral-400">Carregando opções...</div>
  }

  return (
    <div className="px-3 pb-3 pt-1 border-t border-neutral-100 bg-neutral-50 space-y-3">
      {groups.map((group) => (
        <div key={group.id} className="bg-white rounded-lg p-3 border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium">{group.name}</p>
              <p className="text-xs text-neutral-400">
                {group.required ? 'Obrigatório' : 'Opcional'} · {group.multiple ? 'Múltipla escolha' : 'Escolha única'}
              </p>
            </div>
            <button onClick={() => deleteGroup(group.id)} className="text-xs text-red-600 shrink-0">
              Excluir grupo
            </button>
          </div>

          <div className="space-y-1 mb-2">
            {group.menu_item_options.map((choice) => (
              <div key={choice.id} className="flex items-center justify-between text-sm">
                <span>
                  {choice.name}
                  {choice.price_delta !== 0 && (
                    <span className="text-neutral-400">
                      {' '}
                      ({choice.price_delta > 0 ? '+' : ''}
                      R$ {choice.price_delta.toFixed(2).replace('.', ',')})
                    </span>
                  )}
                </span>
                <button onClick={() => deleteChoice(choice.id)} className="text-xs text-red-600">
                  Remover
                </button>
              </div>
            ))}
            {group.menu_item_options.length === 0 && (
              <p className="text-xs text-neutral-400">Nenhuma opção cadastrada ainda.</p>
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={newChoice[group.id]?.name ?? ''}
              onChange={(e) =>
                setNewChoice({ ...newChoice, [group.id]: { name: e.target.value, price_delta: newChoice[group.id]?.price_delta ?? '' } })
              }
              placeholder="Ex: Ao ponto"
              className="flex-1 border border-neutral-300 rounded-lg px-2 py-1.5 text-xs"
            />
            <input
              value={newChoice[group.id]?.price_delta ?? ''}
              onChange={(e) =>
                setNewChoice({ ...newChoice, [group.id]: { name: newChoice[group.id]?.name ?? '', price_delta: e.target.value } })
              }
              placeholder="+R$"
              type="number"
              step="0.01"
              className="w-20 border border-neutral-300 rounded-lg px-2 py-1.5 text-xs"
            />
            <button
              onClick={() => addChoice(group.id)}
              className="shrink-0 rounded-lg bg-brand text-white px-3 text-xs font-medium"
            >
              Add
            </button>
          </div>
        </div>
      ))}

      <form onSubmit={addGroup} className="bg-white rounded-lg p-3 border border-dashed border-neutral-300 space-y-2">
        <input
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="Novo grupo (ex: Ponto da carne, Adicionais)"
          className="w-full border border-neutral-300 rounded-lg px-2 py-1.5 text-xs"
        />
        <div className="flex items-center gap-4 text-xs text-neutral-600">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={newGroupRequired} onChange={(e) => setNewGroupRequired(e.target.checked)} />
            Obrigatório
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={newGroupMultiple} onChange={(e) => setNewGroupMultiple(e.target.checked)} />
            Múltipla escolha
          </label>
          <button className="ml-auto rounded-lg bg-brand text-white px-3 py-1.5 font-medium">Adicionar grupo</button>
        </div>
      </form>
    </div>
  )
}
