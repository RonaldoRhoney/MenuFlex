// ============================================================
// MENUFLEX — WEBHOOK DE CONFIRMAÇÃO DE PAGAMENTO (Mercado Pago)
//
// O Mercado Pago chama essa URL quando o status de um pagamento muda.
// Busca o pagamento pela API do MP (nunca confia no corpo do webhook sem
// checar na fonte — é a forma recomendada pelo MP de evitar notificação
// falsa), casa com a linha em plan_payments pelo external_reference (o id
// que a gente mesmo gerou em mp-checkout.js) e, se aprovado, marca a linha
// como 'approved' e sobe o businesses.plan. Só o service_role escreve em
// plan_payments (RLS em 0004_planos_pagos.sql).
//
// Variáveis de ambiente exigidas (painel da Vercel):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   MP_ACCESS_TOKEN
// ============================================================

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

  if (!SUPABASE_URL || !SERVICE_KEY || !MP_ACCESS_TOKEN) {
    res.status(200).json({ ok: false, reason: 'not_configured' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  // O MP manda o id do pagamento tanto em query string (?data.id=) quanto no
  // corpo, dependendo do tipo de notificação (webhook novo vs IPN antigo).
  const paymentId = req.query['data.id'] || body?.data?.id || body?.id;
  const topic = req.query.type || body?.type || body?.topic;

  if (!paymentId || (topic && topic !== 'payment')) {
    res.status(200).json({ ok: true, ignored: true });
    return;
  }

  const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });

  if (!mpResponse.ok) {
    res.status(200).json({ ok: false, reason: 'payment_not_found' });
    return;
  }

  const payment = await mpResponse.json();
  const externalReference = payment.external_reference;
  if (!externalReference) {
    res.status(200).json({ ok: false, reason: 'no_reference' });
    return;
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: planPayment } = await admin
    .from('plan_payments')
    .select('id, business_id, plan, status')
    .eq('id', externalReference)
    .single();

  if (!planPayment || planPayment.status === 'approved') {
    // Já processado antes (o MP reenvia notificações) ou referência
    // desconhecida — idempotente, não faz nada de novo.
    res.status(200).json({ ok: true });
    return;
  }

  if (payment.status === 'approved') {
    await admin
      .from('plan_payments')
      .update({ status: 'approved', mp_payment_id: String(payment.id), approved_at: new Date().toISOString() })
      .eq('id', planPayment.id);

    await admin.from('businesses').update({ plan: planPayment.plan }).eq('id', planPayment.business_id);
  } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
    await admin
      .from('plan_payments')
      .update({ status: 'rejected', mp_payment_id: String(payment.id) })
      .eq('id', planPayment.id);
  }
  // outros status (pending, in_process) não mudam nada — esperamos a próxima notificação.

  res.status(200).json({ ok: true });
}
