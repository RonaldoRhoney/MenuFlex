-- Correções pós-auditoria de segurança (subagente menuflex-security):
--
-- ALTO: create_order() aceitava p_items vazio e não validava valor total,
-- permitindo qualquer anônimo criar pedidos-lixo (R$0, 0 itens) em qualquer
-- negócio, sem rate limit. Também não havia policy de DELETE em orders,
-- então nem o dono do negócio conseguia limpar spam via API.
--
-- MÉDIO: menu_item_catalog_update_authenticated permitia qualquer lojista
-- autenticado sobrescrever nome/descrição/preço/imagem/segmento de uma
-- entrada criada por outro negócio (só o incremento de usage_count era o
-- uso legítimo pretendido) — vandalismo cross-tenant no autocomplete global.

-- ---------- ALTO: exige item e valor válidos em create_order() ----------
create or replace function public.create_order(
  p_business_id uuid,
  p_order_type text,
  p_delivery_address text,
  p_customer_name text,
  p_customer_phone text,
  p_items jsonb
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

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'O pedido precisa ter pelo menos 1 item';
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

  if v_total <= 0 then
    raise exception 'Valor do pedido inválido';
  end if;

  update public.orders set total = v_total where id = v_order_id;

  insert into public.order_status_history (order_id, status, changed_by)
  values (v_order_id, 'recebido', null);

  return v_order_id;
end;
$$;

-- ---------- ALTO: dono do negócio consegue apagar pedido-lixo ----------
create policy orders_delete_admin on public.orders
  for delete using (public.is_business_admin(business_id));

-- ---------- MÉDIO: protege conteúdo do catálogo compartilhado ----------
-- Mantém o uso legítimo (incrementar usage_count ao reaproveitar um item
-- existente) liberado pra qualquer autenticado, mas bloqueia alteração de
-- nome/descrição/preço/categoria/imagem/segmento por quem não é super-admin.
create or replace function public.protect_menu_item_catalog_content()
returns trigger
language plpgsql
as $$
begin
  if public.is_super_admin() then
    return new;
  end if;
  if new.name is distinct from old.name
     or new.description is distinct from old.description
     or new.suggested_price is distinct from old.suggested_price
     or new.category_hint is distinct from old.category_hint
     or new.image_url is distinct from old.image_url
     or new.segment_id is distinct from old.segment_id
  then
    raise exception 'Só é permitido atualizar o contador de uso deste item do catálogo.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_menu_item_catalog on public.menu_item_catalog;
create trigger trg_protect_menu_item_catalog
  before update on public.menu_item_catalog
  for each row execute function public.protect_menu_item_catalog_content();
