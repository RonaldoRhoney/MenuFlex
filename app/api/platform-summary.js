// ============================================================
// MENUFLEX — RESUMO DE MÉTRICAS DA PLATAFORMA (server-side only, super-admin)
//
// Agrega: total de usuários cadastrados, negócios, visitas por dia,
// dispositivos, navegadores, países, cidades (tudo de page_views, anônimo)
// e bairros dos negócios cadastrados (businesses.neighborhood).
//
// Autenticação: valida o access_token da sessão contra auth.users e só seque
// adiante se o e-mail bater com o super-admin — mesmo e-mail fixo usado nas
// RLS policies (is_super_admin() em supabase/migrations/0004), então mantenha
// os dois em sincronia se esse e-mail mudar.
//
// Variáveis de ambiente exigidas (mesmas do api/track.js):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// ============================================================

import { createClient } from '@supabase/supabase-js';

const SUPER_ADMIN_EMAIL = 'rhoneyinc@gmail.com';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Token ausente.' });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    res.status(500).json({ error: 'Métricas ainda não configuradas (variáveis de ambiente ausentes).' });
    return;
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) {
    res.status(401).json({ error: 'Sessão inválida.' });
    return;
  }
  if (userData.user.email !== SUPER_ADMIN_EMAIL) {
    res.status(403).json({ error: 'Acesso restrito à gerência da RhoneyInc.' });
    return;
  }

  try {
    const agora = new Date();
    const inicio7d = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const inicio30d = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const inicio14d = new Date(agora.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const contarViews = async (filtroTempo) => {
      let query = admin.from('page_views').select('*', { count: 'exact', head: true });
      if (filtroTempo) query = query.gte('created_at', filtroTempo);
      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    };

    const [totalGeral, total7d, total30d, linhas, negocios, listaUsuarios] = await Promise.all([
      contarViews(),
      contarViews(inicio7d),
      contarViews(inicio30d),
      admin.from('page_views').select('device, browser, country, city, created_at').gte('created_at', inicio30d).limit(5000),
      admin.from('businesses').select('neighborhood, plan, is_open'),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    if (linhas.error) throw linhas.error;
    if (negocios.error) throw negocios.error;

    const rows = linhas.data || [];
    const negociosRows = negocios.data || [];
    const totalUsuarios = listaUsuarios?.data?.users?.length ?? 0;

    const contarPor = (arr, campo) => {
      const mapa = {};
      for (const row of arr) {
        const chave = row[campo] || 'Desconhecido';
        mapa[chave] = (mapa[chave] || 0) + 1;
      }
      return Object.entries(mapa)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([label, total]) => ({ label, total }));
    };

    const porDia = {};
    for (const row of rows) {
      if (row.created_at < inicio14d) continue;
      const dia = row.created_at.slice(0, 10);
      porDia[dia] = (porDia[dia] || 0) + 1;
    }

    res.status(200).json({
      total_geral: totalGeral,
      total_7d: total7d,
      total_30d: total30d,
      total_usuarios: totalUsuarios,
      total_negocios: negociosRows.length,
      dispositivos: contarPor(rows, 'device'),
      navegadores: contarPor(rows, 'browser'),
      paises: contarPor(rows, 'country'),
      cidades: contarPor(rows, 'city'),
      bairros: contarPor(negociosRows, 'neighborhood'),
      por_dia: Object.entries(porDia)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dia, total]) => ({ dia, total })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao consultar métricas.' });
  }
}
