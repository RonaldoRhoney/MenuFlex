-- Smart Free Trial: 60 dias de acesso total a partir do PRIMEIRO pedido do
-- negócio (não do cadastro). Inicia uma única vez (on conflict do nothing),
-- nunca reinicia, e não exige nenhuma mudança nas telas/RLS individuais —
-- basta check_plan_feature() também considerar trial ativo, já que é o
-- único ponto de verdade usado por toda regra sensível a plano.

create table if not exists public.trial_periods (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  activated_by_order_id uuid references public.orders(id),
  created_at timestamptz not null default now()
);

alter table public.trial_periods enable row level security;

-- Só leitura pro admin do negócio — nunca insert/update pelo lojista,
-- só a trigger abaixo (security definer) e futuramente o super-admin
-- (extensão manual, Fase 3) escrevem aqui.
create policy trial_periods_select_admin on public.trial_periods
  for select using (public.is_business_admin(business_id));

create or replace function public.has_active_trial(p_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.trial_periods
    where business_id = p_business_id and ends_at > now()
  );
$$;

-- "on conflict do nothing" é a regra de negócio inteira: já garante que o
-- trial inicia uma única vez e nunca reinicia, sem precisar contar pedidos
-- nem checar existência antes num IF separado.
create or replace function public.handle_first_order_starts_trial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.trial_periods (business_id, started_at, ends_at, activated_by_order_id)
  values (new.business_id, now(), now() + interval '60 days', new.id)
  on conflict (business_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_first_order_starts_trial on public.orders;
create trigger on_first_order_starts_trial
  after insert on public.orders
  for each row execute function public.handle_first_order_starts_trial();

-- Único ponto que precisa saber de trial: se ativo, libera TUDO
-- independente do plano real — cada feature_key continua existindo
-- normalmente em plan_features, só ganha esse OR.
create or replace function public.check_plan_feature(p_business_id uuid, p_feature_key text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select pf.enabled
      from public.businesses b
      join public.plan_features pf on pf.plan = b.plan and pf.feature_key = p_feature_key
      where b.id = p_business_id
    ),
    false
  ) or public.has_active_trial(p_business_id);
$$;
