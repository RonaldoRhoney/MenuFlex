import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { Business } from '../../lib/types'

// Só renderiza pra rhoneyinc@gmail.com (ver Painel.tsx) — mas o que garante de verdade
// que só esse e-mail vê todos os negócios é a policy businesses_select_super_admin
// (is_super_admin()) em supabase/migrations/0004_planos_pagos.sql, não esta tela.
export default function SuperAdmin() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) return
    supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBusinesses((data as Business[]) ?? [])
        setLoading(false)
      })
  }, [])

  if (loading) return <p className="text-sm text-neutral-400">Carregando negócios...</p>

  return (
    <div>
      <h2 className="font-semibold mb-1">Todos os negócios</h2>
      <p className="text-sm text-neutral-500 mb-4">
        Visão de gerência da plataforma — {businesses.length} negócio(s) cadastrado(s).
      </p>
      <div className="space-y-2">
        {businesses.map((b) => (
          <div key={b.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2.5 text-sm">
            <div>
              <p className="font-medium">{b.name}</p>
              <p className="text-xs text-neutral-500">/loja/{b.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand/10 text-brand-dark capitalize">
                {b.plan}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {b.is_open ? 'Aberto' : 'Fechado'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
