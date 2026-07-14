-- Programa de indicação (página pública /parceiros): qualquer pessoa indica um negócio
-- pro MenuFlex e, se ele assinar um plano pago, quem indicou ganha comissão (regra de
-- negócio combinada fora do banco — aqui só fica o registro da indicação em si).
-- Mesmo padrão de RLS de consent_logs em 0001_schema.sql: insert público, leitura
-- restrita (aqui só super-admin, que é quem processa a comissão manualmente por ora).
create table if not exists public.partner_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_name text not null,
  referrer_phone text not null,
  business_name text not null,
  business_phone text not null,
  business_city text,
  status text not null default 'novo' check (status in ('novo', 'contatado', 'convertido', 'descartado')),
  created_at timestamptz not null default now()
);

alter table public.partner_referrals enable row level security;

create policy partner_referrals_insert_public on public.partner_referrals
  for insert with check (true);

create policy partner_referrals_select_super_admin on public.partner_referrals
  for select using (public.is_super_admin());

create policy partner_referrals_update_super_admin on public.partner_referrals
  for update using (public.is_super_admin()) with check (public.is_super_admin());
