import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { startPlanUpgrade } from '../../lib/payments'
import type { Business, Plan } from '../../lib/types'

interface ConfiguracoesProps {
  business: Business
  onUpdated: (business: Business) => void
}

const PLANOS: { value: Plan; label: string; preco: string; itens: string[] }[] = [
  {
    value: 'free',
    label: 'Free',
    preco: 'R$ 0',
    itens: [
      'Cardápio digital com marca MenuFlex',
      'Pedido de retirada (limite mensal)',
      'Instalação por proximidade 100m',
      'Painel ADM básico',
    ],
  },
  {
    value: 'basico',
    label: 'Básico',
    preco: 'R$ 19,90/mês',
    itens: ['Tudo do Free', 'Delivery + pedido no local', 'Logo própria', 'Proximidade 300m · Analytics'],
  },
  {
    value: 'premium',
    label: 'Premium',
    preco: 'R$ 39,90/mês',
    itens: [
      'Tudo do Básico',
      'Identidade visual completa',
      'Proximidade 500m · Push',
      'Analytics avançado · Multi-unidades',
    ],
  },
]

const PLAN_RANK: Record<Plan, number> = { free: 0, basico: 1, premium: 2 }

export default function Configuracoes({ business, onUpdated }: ConfiguracoesProps) {
  const [isOpen, setIsOpen] = useState(business.is_open)
  const [upgrading, setUpgrading] = useState<Plan | null>(null)
  const [upgradeError, setUpgradeError] = useState<string | null>(null)

  async function toggleOpen() {
    if (!supabase) return
    const next = !isOpen
    setIsOpen(next)
    const { data } = await supabase.from('businesses').update({ is_open: next }).eq('id', business.id).select().single()
    if (data) onUpdated(data as Business)
  }

  async function handleUpgrade(plan: Exclude<Plan, 'free'>) {
    setUpgradeError(null)
    setUpgrading(plan)
    try {
      const checkoutUrl = await startPlanUpgrade(business, plan)
      // Abre em nova aba — o painel ADM continua aberto, o dono não perde a
      // sessão nem o lugar onde estava caso desista do pagamento no meio.
      window.open(checkoutUrl, '_blank', 'noopener')
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : 'Erro ao iniciar pagamento')
    } finally {
      setUpgrading(null)
    }
  }

  return (
    <div className="space-y-8 max-w-md">
      <section>
        <h2 className="font-semibold mb-3">Status do negócio</h2>
        <button
          onClick={toggleOpen}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-transform active:scale-95 hover:brightness-110 ${
            isOpen ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
          }`}
        >
          {isOpen ? 'Aberto — clique para fechar' : 'Fechado — clique para abrir'}
        </button>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Plano atual: {business.plan}</h2>
        <div className="space-y-2">
          {PLANOS.map((p) => {
            const isCurrent = business.plan === p.value
            const isUpgrade = PLAN_RANK[p.value] > PLAN_RANK[business.plan]
            return (
              <div
                key={p.value}
                className={`rounded-lg border px-3 py-2.5 text-sm transition-all duration-200 hover:-translate-y-0.5 ${
                  isCurrent ? 'border-brand bg-brand/5' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-medium">{p.label}</span>
                  <span className="text-white/40">{p.preco}</span>
                </div>
                <ul className="space-y-1 mb-2">
                  {p.itens.map((item) => (
                    <li key={item} className="flex items-start gap-1.5 text-xs text-white/40">
                      <span className="text-brand shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                {isCurrent && <span className="text-xs font-medium text-brand-dark">Plano atual</span>}
                {isUpgrade && (
                  <button
                    onClick={() => handleUpgrade(p.value as Exclude<Plan, 'free'>)}
                    disabled={upgrading !== null}
                    className="w-full rounded-lg bg-brand text-white py-1.5 text-xs font-medium disabled:opacity-50 transition-transform active:scale-95 enabled:hover:bg-brand-dark"
                  >
                    {upgrading === p.value ? 'Abrindo pagamento...' : `Fazer upgrade para ${p.label}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>
        {upgradeError && <p className="text-xs text-red-400 mt-2">{upgradeError}</p>}
        <p className="text-xs text-white/40 mt-2">
          Pagamento processado via Mercado Pago (PIX, boleto ou cartão) — o valor é repassado à
          RhoneyInc, responsável pela plataforma.
        </p>
      </section>
    </div>
  )
}
