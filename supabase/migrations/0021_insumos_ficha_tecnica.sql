-- Fase 1 do roteiro ERP: Insumos + Ficha Técnica + custo/margem/lucro
-- calculados automaticamente. Exclusivo do plano Premium (feature_key
-- 'gestao_erp'). Ficha técnica é OPCIONAL: item sem nenhuma linha em
-- ficha_tecnica_itens continua vendável normalmente, só com custo/margem
-- zerados — não força recadastro de quem já usa o sistema hoje.

-- ============================================================
-- INSUMOS
-- ============================================================

create table if not exists public.insumos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  nome text not null,
  unidade text not null,
  categoria text,
  estoque_atual numeric(10,2) not null default 0 check (estoque_atual >= 0),
  estoque_minimo numeric(10,2) not null default 0 check (estoque_minimo >= 0),
  custo_unitario numeric(10,4) not null default 0 check (custo_unitario >= 0),
  fornecedor text,
  lote text,
  validade date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists insumos_business_id_idx on public.insumos(business_id);

alter table public.insumos enable row level security;

-- Sem select público, mesmo padrão de estoque_itens (0015_estoque.sql):
-- custo de insumo é dado sensível do negócio, cliente final nunca lê.
create policy insumos_admin on public.insumos
  for all using (
    public.is_business_admin(business_id)
    and public.check_plan_feature(business_id, 'gestao_erp')
  )
  with check (
    public.is_business_admin(business_id)
    and public.check_plan_feature(business_id, 'gestao_erp')
  );

-- ============================================================
-- FICHA TÉCNICA (receita de cada prato)
-- ============================================================

create table if not exists public.ficha_tecnica_itens (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  insumo_id uuid not null references public.insumos(id) on delete restrict,
  quantidade numeric(10,4) not null check (quantidade > 0),
  created_at timestamptz not null default now(),
  unique (menu_item_id, insumo_id)
);

create index if not exists ficha_tecnica_itens_menu_item_id_idx on public.ficha_tecnica_itens(menu_item_id);
create index if not exists ficha_tecnica_itens_insumo_id_idx on public.ficha_tecnica_itens(insumo_id);

alter table public.ficha_tecnica_itens enable row level security;

-- Sem coluna business_id direta: autorização via join até menu_items,
-- mesmo espírito de order_items (0001_schema.sql) que também autoriza via
-- join até orders.
create policy ficha_tecnica_itens_admin on public.ficha_tecnica_itens
  for all using (
    exists (
      select 1 from public.menu_items mi
      where mi.id = menu_item_id
        and public.is_business_admin(mi.business_id)
        and public.check_plan_feature(mi.business_id, 'gestao_erp')
    )
  )
  with check (
    exists (
      select 1 from public.menu_items mi
      where mi.id = menu_item_id
        and public.is_business_admin(mi.business_id)
        and public.check_plan_feature(mi.business_id, 'gestao_erp')
    )
  );

-- ============================================================
-- CUSTO/MARGEM EM MENU_ITEMS (calculados, nunca editados manualmente)
-- ============================================================

alter table public.menu_items
  add column if not exists custo numeric(10,2) not null default 0,
  add column if not exists margem numeric(5,2) not null default 0;

create or replace function public.recalcular_custo_menu_item(p_menu_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_custo numeric(10,2);
  v_price numeric(10,2);
begin
  select coalesce(sum(fti.quantidade * i.custo_unitario), 0)
  into v_custo
  from public.ficha_tecnica_itens fti
  join public.insumos i on i.id = fti.insumo_id
  where fti.menu_item_id = p_menu_item_id;

  select price into v_price from public.menu_items where id = p_menu_item_id;

  update public.menu_items
  set custo = v_custo,
      margem = case when v_price > 0 then round((v_price - v_custo) / v_price * 100, 2) else 0 end
  where id = p_menu_item_id;
end;
$$;

-- Mudou a receita (linha de ficha técnica adicionada/editada/removida).
create or replace function public.handle_ficha_tecnica_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalcular_custo_menu_item(coalesce(new.menu_item_id, old.menu_item_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists on_ficha_tecnica_change on public.ficha_tecnica_itens;
create trigger on_ficha_tecnica_change
  after insert or update or delete on public.ficha_tecnica_itens
  for each row execute function public.handle_ficha_tecnica_change();

-- Mudou o custo de compra de um insumo — recalcula TODOS os pratos que o
-- usam (é o requisito "sempre que alterar o valor de compra do ingrediente,
-- recalcular todos os custos dos produtos relacionados automaticamente").
create or replace function public.handle_insumo_custo_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_menu_item_id uuid;
begin
  if new.custo_unitario is distinct from old.custo_unitario then
    for v_menu_item_id in
      select distinct menu_item_id from public.ficha_tecnica_itens where insumo_id = new.id
    loop
      perform public.recalcular_custo_menu_item(v_menu_item_id);
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists on_insumo_custo_change on public.insumos;
create trigger on_insumo_custo_change
  after update of custo_unitario on public.insumos
  for each row execute function public.handle_insumo_custo_change();

-- Mudou o preço de venda — só a margem muda, custo permanece.
create or replace function public.handle_menu_item_price_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.price is distinct from old.price then
    perform public.recalcular_custo_menu_item(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_menu_item_price_change on public.menu_items;
create trigger on_menu_item_price_change
  after update of price on public.menu_items
  for each row execute function public.handle_menu_item_price_change();

-- ============================================================
-- PLAN FEATURES
-- ============================================================

insert into public.plan_features (plan, feature_key, enabled, usage_limit) values
  ('free',    'gestao_erp', false, null),
  ('basico',  'gestao_erp', false, null),
  ('premium', 'gestao_erp', true,  null)
on conflict (plan, feature_key) do update set
  enabled = excluded.enabled,
  usage_limit = excluded.usage_limit;
