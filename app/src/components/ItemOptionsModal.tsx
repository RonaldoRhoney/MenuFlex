import { useMemo, useState } from 'react'
import type { MenuItem } from '../lib/types'

interface ItemOptionsModalProps {
  item: MenuItem
  onClose: () => void
  onConfirm: (params: { unitPrice: number; optionsSummary: string; quantity: number }) => void
}

export default function ItemOptionsModal({ item, onClose, onConfirm }: ItemOptionsModalProps) {
  const groups = item.option_groups ?? []
  const [selected, setSelected] = useState<Record<string, string[]>>({})
  const [quantity, setQuantity] = useState(1)

  function toggleChoice(groupId: string, choiceId: string, multiple: boolean) {
    setSelected((prev) => {
      const current = prev[groupId] ?? []
      if (multiple) {
        const next = current.includes(choiceId)
          ? current.filter((id) => id !== choiceId)
          : [...current, choiceId]
        return { ...prev, [groupId]: next }
      }
      return { ...prev, [groupId]: [choiceId] }
    })
  }

  const { priceDelta, summaryParts } = useMemo(() => {
    let delta = 0
    const parts: string[] = []
    for (const group of groups) {
      const chosenIds = selected[group.id] ?? []
      const chosenNames = group.choices.filter((c) => chosenIds.includes(c.id))
      for (const choice of chosenNames) delta += choice.price_delta
      if (chosenNames.length > 0) parts.push(chosenNames.map((c) => c.name).join(', '))
    }
    return { priceDelta: delta, summaryParts: parts }
  }, [selected, groups])

  const faltaObrigatorio = groups.some((g) => g.required && (selected[g.id] ?? []).length === 0)
  const unitPrice = item.price + priceDelta
  const totalPrice = unitPrice * quantity

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4 animate-fade-in">
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto animate-slide-up sm:animate-pop-in">
        <div className="p-4 border-b border-neutral-100 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">{item.name}</h2>
            {item.description && <p className="text-sm text-neutral-500 mt-0.5">{item.description}</p>}
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-xl leading-none px-1 transition-colors" aria-label="Fechar">
            ×
          </button>
        </div>

        <div className="p-4 space-y-6">
          {groups.map((group) => (
            <div key={group.id}>
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="text-sm font-medium">{group.name}</h3>
                <span className="text-xs text-neutral-400">
                  {group.required ? 'Obrigatório' : group.multiple ? 'Opcional · várias' : 'Opcional'}
                </span>
              </div>
              <div className="space-y-2">
                {group.choices.map((choice) => {
                  const checked = (selected[group.id] ?? []).includes(choice.id)
                  return (
                    <label
                      key={choice.id}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors duration-150 ${
                        checked ? 'border-brand bg-brand/5' : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type={group.multiple ? 'checkbox' : 'radio'}
                          name={group.id}
                          checked={checked}
                          onChange={() => toggleChoice(group.id, choice.id, group.multiple)}
                          className="accent-brand"
                        />
                        {choice.name}
                      </span>
                      {choice.price_delta > 0 && (
                        <span className="text-neutral-500">+ R$ {choice.price_delta.toFixed(2).replace('.', ',')}</span>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-medium mb-2">Quantidade</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full border border-neutral-300 transition-transform active:scale-90 hover:border-brand"
              >
                −
              </button>
              <span className="w-6 text-center tabular-nums">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-full border border-neutral-300 transition-transform active:scale-90 hover:border-brand"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-neutral-100 p-4">
          <button
            disabled={faltaObrigatorio}
            onClick={() =>
              onConfirm({ unitPrice, optionsSummary: summaryParts.join(' · '), quantity })
            }
            className="w-full rounded-xl bg-brand text-white py-3 font-medium disabled:opacity-40 transition-transform active:scale-[0.98] enabled:hover:bg-brand-dark"
          >
            Adicionar · R$ {totalPrice.toFixed(2).replace('.', ',')}
          </button>
        </div>
      </div>
    </div>
  )
}
