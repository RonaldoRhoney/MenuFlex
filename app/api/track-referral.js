// ============================================================
// MENUFLEX — REGISTRO DE INDICAÇÃO (server-side only)
//
// Mesmo padrão do api/track.js: só a service_role grava em
// referral_events, nunca insert público direto no Postgres.
//
// type='click': qualquer visitante que abriu um link ?ref=<business_id>
//   (nenhuma autenticação — é só alguém navegando).
// type='signup': chamado logo depois que um novo negócio é criado
//   (Onboarding.tsx), exige o token de sessão do dono do negócio recém-
//   criado pra provar que quem está reportando o cadastro é ele mesmo.
//
// Variáveis de ambiente exigidas (painel da Vercel):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// ============================================================

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    // Indicação é best-effort — nunca quebra a experiência do usuário.
    res.status(200).json({ ok: false, reason: 'not_configured' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { type, referrer_business_id, referred_business_id } = body;

  if (!referrer_business_id || (type !== 'click' && type !== 'signup')) {
    res.status(200).json({ ok: false });
    return;
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  if (type === 'signup') {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token || !referred_business_id) {
      res.status(200).json({ ok: false });
      return;
    }

    const { data: userData } = await admin.auth.getUser(token);
    if (!userData?.user) {
      res.status(200).json({ ok: false });
      return;
    }

    const { data: business } = await admin
      .from('businesses')
      .select('id')
      .eq('id', referred_business_id)
      .eq('owner_id', userData.user.id)
      .maybeSingle();

    if (!business) {
      res.status(200).json({ ok: false });
      return;
    }

    // Nunca deixa um negócio "se indicar" — proteção simples contra abuso.
    if (referrer_business_id === referred_business_id) {
      res.status(200).json({ ok: false });
      return;
    }

    await admin.from('referral_events').insert({ referrer_business_id, referred_business_id, event_type: 'signup' });
    res.status(200).json({ ok: true });
    return;
  }

  // type === 'click'
  await admin.from('referral_events').insert({ referrer_business_id, event_type: 'click' });
  res.status(200).json({ ok: true });
}
