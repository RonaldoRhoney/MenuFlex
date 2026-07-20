-- Corrige recursão infinita entre as policies de orders e customers.
--
-- orders_select checava customers direto (exists (select ... from customers)),
-- e customers_select checava orders direto (exists (select ... from orders)) —
-- cada SELECT numa das tabelas disparava a RLS da outra, que disparava a RLS
-- da primeira de novo, ad infinitum. Postgres detecta e recusa com
-- "infinite recursion detected in policy for relation orders".
--
-- Mesmo padrão já usado por is_business_admin/is_business_owner: funções
-- security definer não reaplicam RLS nas tabelas que consultam internamente,
-- então quebram o ciclo.

create or replace function public.is_own_customer_row(p_customer_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.customers c where c.id = p_customer_id and c.auth_user_id = auth.uid()
  );
$$;

create or replace function public.customer_has_order_for_admin(p_customer_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.orders o
    where o.customer_id = p_customer_id and public.is_business_admin(o.business_id)
  );
$$;

drop policy if exists customers_select on public.customers;
create policy customers_select on public.customers
  for select using (
    auth_user_id = auth.uid()
    or public.customer_has_order_for_admin(id)
  );

drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders
  for select using (
    public.is_business_admin(business_id)
    or (customer_id is not null and public.is_own_customer_row(customer_id))
  );

drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          public.is_business_admin(o.business_id)
          or (o.customer_id is not null and public.is_own_customer_row(o.customer_id))
        )
    )
  );

drop policy if exists order_status_history_select on public.order_status_history;
create policy order_status_history_select on public.order_status_history
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id
        and (
          public.is_business_admin(o.business_id)
          or (o.customer_id is not null and public.is_own_customer_row(o.customer_id))
        )
    )
  );
