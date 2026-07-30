// ============================================================
// MENUFLEX — RATE LIMITING COMPARTILHADO (server-side only)
//
// Contador vive na tabela public.rate_limits (migration 0027), porque cada
// instância de função serverless da Vercel tem sua própria memória — um
// contador em memória local não pegaria abuso vindo de instâncias diferentes.
//
// Nunca guarda o IP bruto: a chave gravada no banco é um hash de IP + nome da
// rota, mesma postura de privacidade já usada em api/track.js.
// ============================================================

import crypto from 'node:crypto';

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'desconhecido';
}

function hashKey(bucket, ip) {
  return crypto.createHash('sha256').update(`${bucket}:${ip}`).digest('hex');
}

// Retorna true se a requisição deve ser bloqueada (limite excedido nessa janela).
// Em caso de falha do próprio limitador (RPC indisponível), nunca bloqueia — o
// rate limiting é uma proteção extra, não pode derrubar uma rota saudável.
export async function estourouLimite(admin, req, bucket, { maxRequisicoes, janelaSegundos }) {
  const key = hashKey(bucket, getClientIp(req));
  const { data, error } = await admin.rpc('increment_rate_limit', { p_key: key, p_window_seconds: janelaSegundos });
  if (error) return false;
  return (data ?? 0) > maxRequisicoes;
}
