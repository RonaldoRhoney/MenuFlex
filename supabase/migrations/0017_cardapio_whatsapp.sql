-- Cardápio Inteligente via WhatsApp — Fase 1 (config + envio manual via wa.me,
-- sem motor de resposta automática real / sem credencial de API de terceiros).

-- Número de WhatsApp dedicado, separado de businesses.phone (campo livre
-- genérico, sem garantia de formato/uso) — precisa ser E.164 puro pros links wa.me.
alter table public.businesses
  add column if not exists whatsapp_number text;

create table if not exists public.whatsapp_config (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  welcome_message text not null default 'Olá! 👋 Bem-vindo(a) ao {{Nome do Estabelecimento}}. Como posso ajudar?',
  auto_message text not null default 'Confira nosso cardápio digital: {{link}}',
  auto_reply_enabled boolean not null default false,
  auto_send_menu_enabled boolean not null default false,
  api_provider text not null default 'none'
    check (api_provider in ('none', 'meta_cloud', 'evolution_api', 'z_api', 'twilio', 'baileys', '360dialog')),
  human_service_hours_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.whatsapp_config enable row level security;

create policy whatsapp_config_select on public.whatsapp_config
  for select using (public.is_business_admin(business_id) or public.is_super_admin());
create policy whatsapp_config_insert on public.whatsapp_config
  for insert with check (public.is_business_admin(business_id));
create policy whatsapp_config_update on public.whatsapp_config
  for update using (public.is_business_admin(business_id)) with check (public.is_business_admin(business_id));

-- Estatísticas simples do módulo — tabela própria (não reaproveita page_views,
-- que é exclusiva de super-admin e sem policy de insert para ninguém além
-- do endpoint serverless de tracking).
create table if not exists public.whatsapp_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_type text not null check (event_type in ('click_send', 'menu_sent', 'share_click')),
  created_at timestamptz not null default now()
);

alter table public.whatsapp_events enable row level security;

create policy whatsapp_events_select on public.whatsapp_events
  for select using (public.is_business_admin(business_id) or public.is_super_admin());
create policy whatsapp_events_insert on public.whatsapp_events
  for insert with check (public.is_business_admin(business_id));

create index if not exists whatsapp_events_business_idx on public.whatsapp_events (business_id, event_type, created_at desc);

-- Feature flag de plano — habilitado em todos os planos porque a Fase 1 não
-- usa nenhuma API paga (só wa.me), sem custo marginal a proteger.
insert into public.plan_features (plan, feature_key, enabled, usage_limit) values
  ('free',    'cardapio_whatsapp', true, null),
  ('basico',  'cardapio_whatsapp', true, null),
  ('premium', 'cardapio_whatsapp', true, null)
on conflict (plan, feature_key) do update set enabled = excluded.enabled, usage_limit = excluded.usage_limit;
