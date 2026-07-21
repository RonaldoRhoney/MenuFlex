// ============================================================
// MENUFLEX — CRIA PREFERÊNCIA DE PAGAMENTO (Mercado Pago Checkout Pro)
//
// Chamado pelo front (src/lib/payments.ts) quando o dono clica "fazer
// upgrade". Cria uma "preference" no Mercado Pago com o valor do plano,
// grava uma linha 'pending' em plan_payments (só service_role escreve lá,
// ver 0004_planos_pagos.sql) e devolve a URL de checkout pro front
// redirecionar o usuário. A confirmação de pagamento chega depois via
// webhook (api/mp-webhook.js), nunca aqui.
//
// Variáveis de ambiente exigidas (painel da Vercel):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   MP_ACCESS_TOKEN
//   PUBLIC_SITE_URL (ex: https://menuflex.rhoneyinc.com — usado nas back_urls e no webhook)
// ============================================================

import { createClient } from '@supabase/supabase-js';

const PLAN_PRICES = { basico: 19.9, premium: 39.9 };
const PLAN_LABELS = { basico: 'MenuFlex — Plano Básico', premium: 'MenuFlex — Plano Premium' };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://menuflex.rhoneyinc.com';

  if (!SUPABASE_URL || !SERVICE_KEY || !MP_ACCESS_TOKEN) {
    res.status(500).json({ error: 'Checkout não configurado no servidor.' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { business_id, plan } = body;

  if (!business_id || !PLAN_PRICES[plan]) {
    res.status(400).json({ error: 'Dados de upgrade inválidos.' });
    return;
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // Confere se o negócio existe de verdade antes de criar qualquer cobrança
  // — o valor cobrado vem sempre da tabela de preços do servidor, nunca do
  // que o front mandou, pra não dar pra manipular o amount pelo DevTools.
  const { data: business, error: businessError } = await admin
    .from('businesses')
    .select('id, name')
    .eq('id', business_id)
    .single();

  if (businessError || !business) {
    res.status(404).json({ error: 'Negócio não encontrado.' });
    return;
  }

  const amount = PLAN_PRICES[plan];

  const { data: payment, error: insertError } = await admin
    .from('plan_payments')
    .insert({ business_id, plan, amount, status: 'pending' })
    .select()
    .single();

  if (insertError || !payment) {
    res.status(500).json({ error: 'Não foi possível iniciar o pagamento.' });
    return;
  }

  const preferenceBody = {
    items: [
      {
        title: PLAN_LABELS[plan],
        quantity: 1,
        currency_id: 'BRL',
        unit_price: amount,
      },
    ],
    external_reference: payment.id,
    back_urls: {
      success: `${SITE_URL}/admin?upgrade=sucesso`,
      failure: `${SITE_URL}/admin?upgrade=falhou`,
      pending: `${SITE_URL}/admin?upgrade=pendente`,
    },
    auto_return: 'approved',
    notification_url: `${SITE_URL}/api/mp-webhook`,
  };

  const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(preferenceBody),
  });

  const mpData = await mpResponse.json();

  if (!mpResponse.ok || !mpData.id) {
    // Não deixa a linha 'pending' órfã sem preferência associada.
    await admin.from('plan_payments').delete().eq('id', payment.id);
    res.status(502).json({ error: 'Mercado Pago recusou a criação do pagamento.' });
    return;
  }

  await admin.from('plan_payments').update({ mp_preference_id: mpData.id }).eq('id', payment.id);

  // Com credencial de teste, o Mercado Pago devolve sandbox_init_point (paga-se
  // com um usuário/cartão de teste); com credencial de produção, só init_point
  // existe. Preferimos o sandbox quando disponível.
  res.status(200).json({ checkout_url: mpData.sandbox_init_point || mpData.init_point });
}
