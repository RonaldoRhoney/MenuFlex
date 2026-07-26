-- Sistema de indicação ("Indique o MenuFlex") — cada negócio tem um link
-- próprio (?ref=<business_id>), e cada clique/cadastro vindo desse link
-- é registrado aqui pro painel "Minhas Indicações".

create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  referrer_business_id uuid not null references public.businesses(id) on delete cascade,
  referred_business_id uuid references public.businesses(id) on delete set null,
  event_type text not null check (event_type in ('click', 'signup')),
  created_at timestamptz not null default now()
);

create index if not exists idx_referral_events_referrer on public.referral_events(referrer_business_id);

alter table public.referral_events enable row level security;

-- Sem policy de insert (mesmo padrão de page_views/api/track.js): só a
-- service_role grava aqui, via api/track-referral.js — evita dar insert
-- público direto no Postgres pra qualquer visitante anônimo.
create policy referral_events_select_own on public.referral_events
  for select using (public.is_business_admin(referrer_business_id));
