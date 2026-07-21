import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { Business, Plan, PartnerReferral, ReferralStatus } from '../../lib/types'
import PlatformMetrics from '../../components/admin/PlatformMetrics'

// Só renderiza pra rhoneyinc@gmail.com (ver Painel.tsx) — mas o que garante de verdade
// que só esse e-mail vê todos os negócios/indicações é a policy is_super_admin() em
// supabase/migrations/0004_planos_pagos.sql e 0006_indicacoes_parceiros.sql, não esta tela.

const PLANOS: Plan[] = ['free', 'basico', 'premium']

const STATUS_INDICACAO: { value: ReferralStatus; label: string }[] = [
  { value: 'novo', label: 'Novo' },
  { value: 'contatado', label: 'Contatado' },
  { value: 'convertido', label: 'Convertido' },
  { value: 'descartado', label: 'Descartado' },
]

export default function SuperAdmin() {
  const [aba, setAba] = useState<'metricas' | 'negocios' | 'indicacoes'>('metricas')
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [referrals, setReferrals] = useState<PartnerReferral[]>([])
  const [loading, setLoading] = useState(true)
  const [salvandoId, setSalvandoId] = useState<string | null>(null)

  async function reload() {
    if (!supabase) return
    const [{ data: negocios }, { data: indicacoes }] = await Promise.all([
      supabase.from('businesses').select('*').order('created_at', { ascending: false }),
      supabase.from('partner_referrals').select('*').order('created_at', { ascending: false }),
    ])
    setBusinesses((negocios as Business[]) ?? [])
    setReferrals((indicacoes as PartnerReferral[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    reload()
  }, [])

  async function alterarPlano(business: Business, novoPlano: Plan) {
    if (!supabase || novoPlano === business.plan) return
    setSalvandoId(business.id)
    await supabase.from('businesses').update({ plan: novoPlano }).eq('id', business.id)
    await reload()
    setSalvandoId(null)
  }

  async function alterarStatusIndicacao(referral: PartnerReferral, novoStatus: ReferralStatus) {
    if (!supabase || novoStatus === referral.status) return
    setSalvandoId(referral.id)
    await supabase.from('partner_referrals').update({ status: novoStatus }).eq('id', referral.id)
    await reload()
    setSalvandoId(null)
  }

  if (loading) return <p className="text-sm text-neutral-400">Carregando...</p>

  return (
    <div>
      <h2 className="font-semibold mb-1">Gerência RhoneyInc</h2>
      <p className="text-sm text-neutral-500 mb-4">
        {businesses.length} negócio(s) · {referrals.length} indicação(ões)
      </p>

      <div className="flex gap-1 mb-4 border-b border-neutral-200">
        <button
          onClick={() => setAba('metricas')}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
            aba === 'metricas' ? 'border-brand text-brand-dark' : 'border-transparent text-neutral-500'
          }`}
        >
          Métricas
        </button>
        <button
          onClick={() => setAba('negocios')}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
            aba === 'negocios' ? 'border-brand text-brand-dark' : 'border-transparent text-neutral-500'
          }`}
        >
          Negócios
        </button>
        <button
          onClick={() => setAba('indicacoes')}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
            aba === 'indicacoes' ? 'border-brand text-brand-dark' : 'border-transparent text-neutral-500'
          }`}
        >
          Indicações
          {referrals.filter((r) => r.status === 'novo').length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center text-xs bg-brand text-white rounded-full w-5 h-5">
              {referrals.filter((r) => r.status === 'novo').length}
            </span>
          )}
        </button>
      </div>

      {aba === 'metricas' && <PlatformMetrics />}

      {aba === 'negocios' && (
        <div className="space-y-2">
          {businesses.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2.5 text-sm">
              <div>
                <p className="font-medium">{b.name}</p>
                <a
                  href={`/loja/${b.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-dark hover:underline"
                >
                  /loja/{b.slug} ↗
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {b.is_open ? 'Aberto' : 'Fechado'}
                </span>
                <select
                  value={b.plan}
                  disabled={salvandoId === b.id}
                  onChange={(e) => alterarPlano(b, e.target.value as Plan)}
                  className="text-xs font-medium px-2 py-1 rounded-full bg-brand/10 text-brand-dark capitalize border-0"
                >
                  {PLANOS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          {businesses.length === 0 && <p className="text-sm text-neutral-400">Nenhum negócio cadastrado ainda.</p>}
        </div>
      )}

      {aba === 'indicacoes' && (
        <div className="space-y-2">
          {referrals.map((r) => (
            <div key={r.id} className="rounded-lg border border-neutral-200 px-3 py-2.5 text-sm">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <p className="font-medium">{r.business_name}</p>
                  <p className="text-xs text-neutral-500">
                    {r.business_phone}
                    {r.business_city && ` · ${r.business_city}`}
                  </p>
                </div>
                <select
                  value={r.status}
                  disabled={salvandoId === r.id}
                  onChange={(e) => alterarStatusIndicacao(r, e.target.value as ReferralStatus)}
                  className="text-xs font-medium px-2 py-1 rounded-full bg-neutral-100 border-0 shrink-0"
                >
                  {STATUS_INDICACAO.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-neutral-500">
                Indicado por <strong>{r.referrer_name}</strong> · {r.referrer_phone} ·{' '}
                {new Date(r.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))}
          {referrals.length === 0 && <p className="text-sm text-neutral-400">Nenhuma indicação recebida ainda.</p>}
        </div>
      )}
    </div>
  )
}
