-- ---------- MÉDIO: rate limiting nas rotas serverless (achado 9 da auditoria) ----------
-- Nenhum endpoint em app/api/*.js limitava quantas vezes o mesmo visitante podia
-- chamá-lo por minuto — abria brecha pra abuso (spam de page_views/referral_events,
-- tentativas repetidas de checkout). Como as funções da Vercel são serverless (cada
-- instância tem sua própria memória), um contador em memória não funciona de forma
-- confiável — por isso o contador vive aqui no Postgres, compartilhado entre todas
-- as instâncias.
--
-- A "key" nunca é o IP bruto — é um hash (gerado no servidor, em app/api/_lib/
-- rateLimit.js) de IP + nome da rota, mantendo a mesma postura de privacidade já
-- adotada em track.js (nunca guardar IP identificável).
create table if not exists public.rate_limits (
  key text primary key,
  count int not null default 1,
  window_start timestamptz not null default now()
);

alter table public.rate_limits enable row level security;
-- Sem nenhuma policy: só a função abaixo (security definer) lê/escreve nessa tabela.

create or replace function public.increment_rate_limit(p_key text, p_window_seconds int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into public.rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set count = case
          when public.rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
            then 1
          else public.rate_limits.count + 1
        end,
        window_start = case
          when public.rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
            then now()
          else public.rate_limits.window_start
        end
  returning count into v_count;
  return v_count;
end;
$$;
