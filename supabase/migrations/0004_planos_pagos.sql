-- Gerência total da plataforma (todos os negócios, todos os pagamentos) fica com um único
-- e-mail: rhoneyinc@gmail.com (ver src/lib/constants.ts). Sem tabela de admins — é só um
-- e-mail fixo, então a checagem é direto no JWT da sessão, sem round-trip.
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'rhoneyinc@gmail.com';
$$;

-- Super-admin enxerga/edita qualquer negócio, além do próprio dono (política já existente
-- businesses_update_admin / businesses_select_public em 0001_schema.sql continuam valendo,
-- esta é só um "OR" adicional).
create policy businesses_select_super_admin on public.businesses
  for select using (public.is_super_admin());
create policy businesses_update_super_admin on public.businesses
  for update using (public.is_super_admin()) with check (public.is_super_admin());

-- ============================================================
-- PAGAMENTOS DE UPGRADE DE PLANO (Mercado Pago)
-- ============================================================
-- Fluxo: dono do negócio clica "fazer upgrade" -> front chama uma função serverless
-- (ainda não criada — ver src/lib/payments.ts) que cria uma preference no Mercado Pago
-- e insere aqui uma linha 'pending' -> Mercado Pago manda webhook na confirmação -> a
-- mesma função serverless (com service_role, único papel que pode escrever aqui) marca
-- 'approved' e atualiza businesses.plan. O valor cai na conta Mercado Pago de
-- rhoneyinc@gmail.com; o saque pra Nubank é feito manualmente via PIX fora do app.
create table if not exists public.plan_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  plan text not null check (plan in ('basico', 'premium')),
  amount numeric(10,2) not null check (amount >= 0),
  mp_preference_id text,
  mp_payment_id text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

alter table public.plan_payments enable row level security;

create policy plan_payments_select_admin on public.plan_payments
  for select using (public.is_business_admin(business_id) or public.is_super_admin());

-- Sem policy de insert/update: só o service_role (usado pela função serverless do
-- webhook) escreve aqui, contornando o RLS. Isso evita que alguém marque o próprio
-- pagamento como "approved" direto pela API pública.
