-- MenuFlex — schema inicial (MVP)
-- Multi-tenant: um negócio (business) por linha, cardápio e pedidos isolados por RLS.

create extension if not exists pgcrypto;

-- ============================================================
-- TABELAS
-- ============================================================

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  type text not null check (type in ('lanche_rua','bar','restaurante','hamburgueria','outro')),
  plan text not null default 'free' check (plan in ('free','basico','premium')),
  theme_config jsonb not null default '{}'::jsonb,
  lat double precision,
  lng double precision,
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.business_admins (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','staff')),
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  order_index int not null default 0
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid references public.menu_categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  is_available boolean not null default true,
  order_index int not null default 0
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  phone text,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  order_type text not null check (order_type in ('retirada','delivery','local')),
  status text not null default 'recebido' check (status in ('recebido','preparo','pronto','entregue','cancelado')),
  total numeric(10,2) not null default 0 check (total >= 0),
  delivery_address text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  quantity int not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  notes text
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id) on delete set null
);

-- feature_key exemplos: cardapio_digital, pedido_retirada, pedido_local, delivery,
-- logo_propria, identidade_completa, push_notifications, analytics_basico,
-- analytics_avancado, multiplas_unidades, instalacao_proximidade
-- "limit" é palavra reservada em SQL; usamos usage_limit para o mesmo papel
-- descrito no brief (ex.: limite mensal de pedidos retirada no Free, raio de
-- instalação por proximidade em metros).
create table if not exists public.plan_features (
  plan text not null check (plan in ('free','basico','premium')),
  feature_key text not null,
  enabled boolean not null default false,
  usage_limit int,
  primary key (plan, feature_key)
);

-- LGPD: registro de consentimento (ex.: geolocalização) e pedidos de exclusão de dados.
create table if not exists public.consent_logs (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  business_id uuid references public.businesses(id) on delete set null,
  consent_type text not null,
  granted boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists public.data_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by_auth_user_id uuid references auth.users(id) on delete set null,
  contact_email text,
  contact_phone text,
  details text,
  status text not null default 'pendente' check (status in ('pendente','concluido')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- FUNÇÕES (security definer — mesmo padrão do is_admin() do RhoneyInc/MeuPet)
-- ============================================================

create or replace function public.is_business_owner(p_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.businesses
    where id = p_business_id and owner_id = auth.uid()
  );
$$;

create or replace function public.is_business_admin(p_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.business_admins
    where business_id = p_business_id and user_id = auth.uid()
  );
$$;

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
  );
$$;

create or replace function public.get_plan_usage_limit(p_business_id uuid, p_feature_key text)
returns int
language sql
security definer
set search_path = public
stable
as $$
  select (
    select pf.usage_limit
    from public.businesses b
    join public.plan_features pf on pf.plan = b.plan and pf.feature_key = p_feature_key
    where b.id = p_business_id
  );
$$;

-- Cria automaticamente o vínculo owner em business_admins ao criar um negócio.
create or replace function public.handle_new_business()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.business_admins (business_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

drop trigger if exists on_business_created on public.businesses;
create trigger on_business_created
  after insert on public.businesses
  for each row execute function public.handle_new_business();

-- Auditoria automática de mudança de status do pedido.
create or replace function public.handle_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.order_status_history (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists on_order_status_change on public.orders;
create trigger on_order_status_change
  after update of status on public.orders
  for each row execute function public.handle_order_status_change();

-- RPC usada pelo fluxo público de pedido (cliente sem login). Roda como
-- security definer para não depender de policies de INSERT anônimas em
-- orders/order_items/customers, e aplica o gate de plano no mesmo lugar.
create or replace function public.create_order(
  p_business_id uuid,
  p_order_type text,
  p_delivery_address text,
  p_customer_name text,
  p_customer_phone text,
  p_items jsonb -- [{ "menu_item_id": uuid, "quantity": int, "unit_price": numeric, "notes": text }]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_total numeric(10,2) := 0;
  v_item jsonb;
  v_monthly_limit int;
  v_monthly_count int;
begin
  if p_order_type not in ('retirada','delivery','local') then
    raise exception 'order_type inválido';
  end if;

  if p_order_type = 'local' and not public.check_plan_feature(p_business_id, 'pedido_local') then
    raise exception 'Pedido no local não disponível no plano deste negócio';
  end if;

  if p_order_type = 'delivery' and not public.check_plan_feature(p_business_id, 'delivery') then
    raise exception 'Delivery não disponível no plano deste negócio';
  end if;

  if p_order_type = 'retirada' then
    v_monthly_limit := public.get_plan_usage_limit(p_business_id, 'pedido_retirada');
    if v_monthly_limit is not null then
      select count(*) into v_monthly_count
      from public.orders
      where business_id = p_business_id
        and order_type = 'retirada'
        and created_at >= date_trunc('month', now());
      if v_monthly_count >= v_monthly_limit then
        raise exception 'Limite mensal de pedidos de retirada atingido para este negócio';
      end if;
    end if;
  end if;

  insert into public.customers (auth_user_id, phone, name)
  values (auth.uid(), p_customer_phone, p_customer_name)
  returning id into v_customer_id;

  insert into public.orders (business_id, customer_id, order_type, delivery_address, total)
  values (p_business_id, v_customer_id, p_order_type, p_delivery_address, 0)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.order_items (order_id, menu_item_id, quantity, unit_price, notes)
    values (
      v_order_id,
      (v_item->>'menu_item_id')::uuid,
      (v_item->>'quantity')::int,
      (v_item->>'unit_price')::numeric,
      v_item->>'notes'
    );
    v_total := v_total + (v_item->>'quantity')::int * (v_item->>'unit_price')::numeric;
  end loop;

  update public.orders set total = v_total where id = v_order_id;

  insert into public.order_status_history (order_id, status, changed_by)
  values (v_order_id, 'recebido', null);

  return v_order_id;
end;
$$;

-- RPC de leitura pública e restrita para acompanhamento de pedido por clientes
-- anônimos (sem login) — expõe só os campos necessários, nunca a tabela crua.
create or replace function public.get_public_order_status(p_order_id uuid)
returns table (id uuid, status text, order_type text, total numeric, created_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select id, status, order_type, total, created_at
  from public.orders
  where id = p_order_id;
$$;

-- ============================================================
-- RLS
-- ============================================================

alter table public.businesses enable row level security;
alter table public.business_admins enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.plan_features enable row level security;
alter table public.consent_logs enable row level security;
alter table public.data_deletion_requests enable row level security;

-- businesses: cardápio público precisa ler sem login.
create policy businesses_select_public on public.businesses
  for select using (true);
create policy businesses_insert_own on public.businesses
  for insert with check (auth.uid() = owner_id);
create policy businesses_update_admin on public.businesses
  for update using (public.is_business_admin(id)) with check (public.is_business_admin(id));
create policy businesses_delete_owner on public.businesses
  for delete using (auth.uid() = owner_id);

-- business_admins: só o dono do negócio gerencia a lista de admins.
create policy business_admins_select on public.business_admins
  for select using (user_id = auth.uid() or public.is_business_owner(business_id));
create policy business_admins_insert_owner on public.business_admins
  for insert with check (public.is_business_owner(business_id));
create policy business_admins_update_owner on public.business_admins
  for update using (public.is_business_owner(business_id)) with check (public.is_business_owner(business_id));
create policy business_admins_delete_owner on public.business_admins
  for delete using (public.is_business_owner(business_id));

-- menu_categories / menu_items: leitura pública (cardápio), escrita só admin do negócio.
create policy menu_categories_select_public on public.menu_categories
  for select using (true);
create policy menu_categories_write_admin on public.menu_categories
  for all using (public.is_business_admin(business_id)) with check (public.is_business_admin(business_id));

create policy menu_items_select_public on public.menu_items
  for select using (true);
create policy menu_items_write_admin on public.menu_items
  for all using (public.is_business_admin(business_id)) with check (public.is_business_admin(business_id));

-- customers: cliente vê/edita seu próprio cadastro; admin de negócio vê clientes
-- que pediram nesse negócio (necessário p/ contato de entrega). Escrita direta
-- é bloqueada — a criação acontece via create_order() (security definer).
create policy customers_select on public.customers
  for select using (
    auth_user_id = auth.uid()
    or exists (
      select 1 from public.orders o
      where o.customer_id = customers.id and public.is_business_admin(o.business_id)
    )
  );
create policy customers_update_own on public.customers
  for update using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

-- orders: leitura pelo cliente dono do pedido ou admin do negócio. Criação de
-- pedido de cliente é via create_order(); admin também pode inserir manualmente
-- (pedido de balcão) e é quem atualiza o status.
create policy orders_select on public.orders
  for select using (
    public.is_business_admin(business_id)
    or (customer_id is not null and exists (
      select 1 from public.customers c where c.id = orders.customer_id and c.auth_user_id = auth.uid()
    ))
  );
create policy orders_insert_admin on public.orders
  for insert with check (public.is_business_admin(business_id));
create policy orders_update_admin on public.orders
  for update using (public.is_business_admin(business_id)) with check (public.is_business_admin(business_id));

-- order_items: mesma visibilidade do pedido pai; escrita direta só admin
-- (fluxo de cliente usa create_order()).
create policy order_items_select on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          public.is_business_admin(o.business_id)
          or (o.customer_id is not null and exists (
            select 1 from public.customers c where c.id = o.customer_id and c.auth_user_id = auth.uid()
          ))
        )
    )
  );
create policy order_items_write_admin on public.order_items
  for all using (
    exists (select 1 from public.orders o where o.id = order_items.order_id and public.is_business_admin(o.business_id))
  ) with check (
    exists (select 1 from public.orders o where o.id = order_items.order_id and public.is_business_admin(o.business_id))
  );

-- order_status_history: só leitura (escrita é via trigger security definer).
create policy order_status_history_select on public.order_status_history
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id
        and (
          public.is_business_admin(o.business_id)
          or (o.customer_id is not null and exists (
            select 1 from public.customers c where c.id = o.customer_id and c.auth_user_id = auth.uid()
          ))
        )
    )
  );

-- plan_features: leitura pública (front precisa saber o que está liberado); sem escrita via API.
create policy plan_features_select_public on public.plan_features
  for select using (true);

-- consent_logs / data_deletion_requests: qualquer um pode registrar; só o
-- próprio usuário autenticado consulta o que registrou.
create policy consent_logs_insert on public.consent_logs
  for insert with check (true);
create policy consent_logs_select_own on public.consent_logs
  for select using (auth_user_id = auth.uid());

create policy data_deletion_requests_insert on public.data_deletion_requests
  for insert with check (true);
create policy data_deletion_requests_select_own on public.data_deletion_requests
  for select using (requested_by_auth_user_id = auth.uid());
