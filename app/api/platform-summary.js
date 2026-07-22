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

// Mesmos valores exibidos em src/App.tsx (seção de planos) — usados aqui só
// pra estimar MRR a partir de businesses.plan. Se o preço mudar lá, mude aqui
// também (não há uma única fonte de verdade pra isso ainda).
const PRECO_PLANO = { free: 0, basico: 19.9, premium: 39.9 };

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

    const [totalGeral, total7d, total30d, linhas, negocios, listaUsuarios, adminsNegocio, pagamentos, pedidos] =
      await Promise.all([
        contarViews(),
        contarViews(inicio7d),
        contarViews(inicio30d),
        admin.from('page_views').select('device, browser, country, city, created_at').gte('created_at', inicio30d).limit(5000),
        admin.from('businesses').select('id, neighborhood, plan, is_open'),
        admin.auth.admin.listUsers({ perPage: 1000 }),
        admin.from('business_admins').select('user_id, role, created_at, businesses(id, name, plan, slug)'),
        admin.from('plan_payments').select('status, amount, created_at'),
        admin.from('orders').select('status, total, created_at').gte('created_at', inicio30d),
      ]);

    if (linhas.error) throw linhas.error;
    if (negocios.error) throw negocios.error;
    if (adminsNegocio.error) throw adminsNegocio.error;
    if (pagamentos.error) throw pagamentos.error;
    if (pedidos.error) throw pedidos.error;

    const rows = linhas.data || [];
    const negociosRows = negocios.data || [];
    const usersById = new Map((listaUsuarios?.data?.users || []).map((u) => [u.id, u]));
    const totalUsuarios = usersById.size;

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

    // TODOS os usuários cadastrados (aba "Usuários") — não só quem completou
    // o onboarding (tem negócio). auth.users não é consultável direto pelo
    // client nem com service_role via PostgREST, só pela Admin API; cruza
    // com business_admins pra saber quem tem negócio vinculado.
    const adminByUserId = new Map((adminsNegocio.data || []).map((row) => [row.user_id, row]));
    const usuarios = Array.from(usersById.values())
      .map((authUser) => {
        const admRow = adminByUserId.get(authUser.id);
        return {
          id: authUser.id,
          email: authUser.email ?? null,
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at ?? null,
          role: admRow?.role ?? null,
          business_name: admRow?.businesses?.name ?? null,
          business_slug: admRow?.businesses?.slug ?? null,
          business_plan: admRow?.businesses?.plan ?? null,
          completou_cadastro: !!admRow,
        };
      })
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

    const usuariosCompletos = usuarios.filter((u) => u.completou_cadastro).length;

    const cadastrosPorDia = {};
    for (const u of usuarios) {
      if (!u.created_at) continue;
      const dia = u.created_at.slice(0, 10);
      cadastrosPorDia[dia] = (cadastrosPorDia[dia] || 0) + 1;
    }

    // Financeiro: MRR estimado a partir do plano ativo de cada negócio (não
    // depende de plan_payments estar em dia — reflete o que a régua de
    // features já aplica agora) + status dos pagamentos via Mercado Pago.
    const negociosPorPlano = { free: 0, basico: 0, premium: 0 };
    for (const b of negociosRows) {
      negociosPorPlano[b.plan] = (negociosPorPlano[b.plan] || 0) + 1;
    }
    const mrrEstimado = Object.entries(negociosPorPlano).reduce(
      (soma, [plano, qtd]) => soma + qtd * (PRECO_PLANO[plano] ?? 0),
      0,
    );

    const pagamentosRows = pagamentos.data || [];
    const statusPagamentos = { pending: 0, approved: 0, rejected: 0 };
    let receitaAprovadaTotal = 0;
    let receitaAprovada30d = 0;
    for (const p of pagamentosRows) {
      statusPagamentos[p.status] = (statusPagamentos[p.status] || 0) + 1;
      if (p.status === 'approved') {
        receitaAprovadaTotal += Number(p.amount) || 0;
        if (p.created_at >= inicio30d) receitaAprovada30d += Number(p.amount) || 0;
      }
    }

    // Operacional: volume e ticket médio de pedidos (todos os negócios),
    // últimos 30 dias.
    const pedidosRows = pedidos.data || [];
    const pedidosHoje = pedidosRows.filter((o) => o.created_at.slice(0, 10) === agora.toISOString().slice(0, 10)).length;
    const pedidos7d = pedidosRows.filter((o) => o.created_at >= inicio7d).length;
    const pedidosPorStatus = {};
    let somaTotal = 0;
    for (const o of pedidosRows) {
      pedidosPorStatus[o.status] = (pedidosPorStatus[o.status] || 0) + 1;
      somaTotal += Number(o.total) || 0;
    }
    const ticketMedio30d = pedidosRows.length > 0 ? somaTotal / pedidosRows.length : 0;

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
      usuarios,
      usuarios_resumo: {
        total: usuarios.length,
        completos: usuariosCompletos,
        pendentes: usuarios.length - usuariosCompletos,
      },
      cadastros_por_dia: Object.entries(cadastrosPorDia)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dia, total]) => ({ dia, total })),
      financeiro: {
        mrr_estimado: mrrEstimado,
        negocios_por_plano: negociosPorPlano,
        pagamentos_por_status: statusPagamentos,
        receita_aprovada_total: receitaAprovadaTotal,
        receita_aprovada_30d: receitaAprovada30d,
      },
      operacional: {
        pedidos_hoje: pedidosHoje,
        pedidos_7d: pedidos7d,
        pedidos_30d: pedidosRows.length,
        ticket_medio_30d: ticketMedio30d,
        pedidos_por_status_30d: pedidosPorStatus,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao consultar métricas.' });
  }
}
