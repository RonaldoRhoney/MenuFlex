-- Métricas da plataforma pro painel "Gerência RhoneyInc" (super-admin):
-- visitas anônimas (dispositivo/país/cidade) + bairro dos negócios cadastrados.

-- ============================================================
-- page_views — mesmo padrão do RhoneyInc (schema.sql): nunca guarda IP bruto,
-- nome ou qualquer dado identificável. Gravado só pela função serverless
-- api/track.js (service_role), sem policy de insert pra ninguém.
-- ============================================================
create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  device text not null default 'desktop' check (device in ('mobile', 'tablet', 'desktop')),
  browser text,
  country text,
  region text,
  city text,
  referrer text,
  created_at timestamptz not null default now()
);

alter table public.page_views enable row level security;

create policy page_views_select_super_admin on public.page_views
  for select using (public.is_super_admin());

create index if not exists page_views_created_at_idx on public.page_views (created_at desc);

-- ============================================================
-- Bairro do negócio (preenchido opcionalmente pelo dono em "Minha Empresa") —
-- usado só como métrica agregada de onde a plataforma está presente, não é
-- geolocalização de visitante.
-- ============================================================
alter table public.businesses
  add column if not exists neighborhood text;
