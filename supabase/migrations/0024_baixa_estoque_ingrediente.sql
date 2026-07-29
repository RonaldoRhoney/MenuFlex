-- Fase 1 do roteiro de Estoque Inteligente: a Ficha Técnica (ficha_tecnica_itens)
-- passa a descontar de verdade o estoque dos INGREDIENTES quando um pedido
-- avança pra "preparo" — até aqui ela só alimentava custo/margem
-- (0021_insumos_ficha_tecnica.sql). O desconto por prato pronto
-- (estoque_itens, 0015_estoque.sql) continua existindo em paralelo, sem
-- conflito: um item usa um mecanismo ou o outro.

alter table public.businesses
  add column if not exists estoque_comportamento text not null default 'ocultar'
    check (estoque_comportamento in ('ocultar', 'indisponivel', 'permitir'));

alter table public.menu_items
  add column if not exists sem_estoque_ingrediente boolean not null default false;

-- Mesmo espírito de handle_estoque_zerado() (0015_estoque.sql): só ATUA
-- automaticamente ocultando o produto, nunca reativa sozinho — o lojista
-- confirma manualmente depois de repor o insumo.
create or replace function public.recalcular_disponibilidade_ingrediente(p_menu_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sem_estoque boolean;
  v_comportamento text;
  v_business_id uuid;
begin
  select business_id into v_business_id from public.menu_items where id = p_menu_item_id;
  if v_business_id is null then
    return;
  end if;

  select estoque_comportamento into v_comportamento from public.businesses where id = v_business_id;

  select exists (
    select 1
    from public.ficha_tecnica_itens fti
    join public.insumos i on i.id = fti.insumo_id
    where fti.menu_item_id = p_menu_item_id and i.estoque_atual <= 0
  ) into v_sem_estoque;

  update public.menu_items set sem_estoque_ingrediente = v_sem_estoque where id = p_menu_item_id;

  if v_sem_estoque and v_comportamento = 'ocultar' then
    update public.menu_items set is_available = false where id = p_menu_item_id;
  end if;
end;
$$;

-- Reage a QUALQUER mudança em estoque_atual de um insumo (pedido, edição
-- manual, futuras Entradas/Saídas) — não só à baixa por pedido abaixo.
create or replace function public.handle_insumo_estoque_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_menu_item_id uuid;
begin
  if new.estoque_atual is distinct from old.estoque_atual then
    for v_menu_item_id in
      select distinct menu_item_id from public.ficha_tecnica_itens where insumo_id = new.id
    loop
      perform public.recalcular_disponibilidade_ingrediente(v_menu_item_id);
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists on_insumo_estoque_change on public.insumos;
create trigger on_insumo_estoque_change
  after update of estoque_atual on public.insumos
  for each row execute function public.handle_insumo_estoque_change();

-- Débito/estorno de insumos por pedido. Agrega o consumo por insumo ANTES
-- de atualizar (um UPDATE...FROM sem agregação prévia sub-contaria quando o
-- mesmo insumo aparece em mais de um item do carrinho — Postgres não soma
-- linhas de origem repetidas pro mesmo alvo, só aplicaria uma delas).
create or replace function public.handle_order_ingredient_stock_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then

    if new.status = 'preparo' then
      with consumo as (
        select fti.insumo_id, sum(fti.quantidade * oi.quantity) as total
        from public.order_items oi
        join public.ficha_tecnica_itens fti on fti.menu_item_id = oi.menu_item_id
        where oi.order_id = new.id
        group by fti.insumo_id
      )
      update public.insumos i
      set estoque_atual = greatest(i.estoque_atual - consumo.total, 0),
          updated_at = now()
      from consumo
      where i.id = consumo.insumo_id;

    elsif new.status = 'cancelado' and old.status in ('preparo', 'pronto', 'entregue') then
      with consumo as (
        select fti.insumo_id, sum(fti.quantidade * oi.quantity) as total
        from public.order_items oi
        join public.ficha_tecnica_itens fti on fti.menu_item_id = oi.menu_item_id
        where oi.order_id = new.id
        group by fti.insumo_id
      )
      update public.insumos i
      set estoque_atual = i.estoque_atual + consumo.total,
          updated_at = now()
      from consumo
      where i.id = consumo.insumo_id;
    end if;

  end if;
  return new;
end;
$$;

drop trigger if exists on_order_ingredient_stock_change on public.orders;
create trigger on_order_ingredient_stock_change
  after update of status on public.orders
  for each row execute function public.handle_order_ingredient_stock_change();
