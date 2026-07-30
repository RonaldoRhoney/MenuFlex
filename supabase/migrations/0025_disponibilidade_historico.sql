-- Controle Inteligente de Disponibilidade: histórico de mudança + restrição
-- por papel (só o dono pode alternar manualmente — primeira vez que
-- business_admins.role passa a ser checado nesse app, antes era só decorativo).

create table if not exists public.disponibilidade_historico (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id), -- nulo quando a mudança é automática (estoque)
  status_anterior boolean not null,
  status_novo boolean not null,
  motivo text,
  created_at timestamptz not null default now()
);

create index if not exists disponibilidade_historico_menu_item_idx on public.disponibilidade_historico(menu_item_id);

alter table public.disponibilidade_historico enable row level security;

-- Só leitura pro admin do negócio — nenhuma policy de insert direta:
-- só o RPC/trigger abaixo (security definer) grava aqui.
create policy disponibilidade_historico_select_admin on public.disponibilidade_historico
  for select using (public.is_business_admin(business_id));

-- Mesmo padrão de is_business_admin(), mas exige role = 'owner'.
create or replace function public.is_business_owner(p_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.business_admins
    where business_id = p_business_id and user_id = auth.uid() and role = 'owner'
  );
$$;

-- Único caminho sancionado pro lojista alternar disponibilidade manualmente:
-- checa que quem chamou é dono, grava o novo status e o histórico no mesmo
-- lugar. O cliente (Cardapio.tsx) usa isso em vez de update() direto.
create or replace function public.alterar_disponibilidade_produto(
  p_menu_item_id uuid,
  p_novo_status boolean,
  p_motivo text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_status_atual boolean;
begin
  select business_id, is_available into v_business_id, v_status_atual
  from public.menu_items where id = p_menu_item_id;

  if v_business_id is null then
    raise exception 'Produto não encontrado.';
  end if;

  if not public.is_business_owner(v_business_id) then
    raise exception 'Só o dono do negócio pode alterar a disponibilidade de um produto.';
  end if;

  update public.menu_items set is_available = p_novo_status where id = p_menu_item_id;

  insert into public.disponibilidade_historico (menu_item_id, business_id, user_id, status_anterior, status_novo, motivo)
  values (p_menu_item_id, v_business_id, auth.uid(), v_status_atual, p_novo_status, p_motivo);
end;
$$;

-- Estende a função já existente (0024_baixa_estoque_ingrediente.sql) pra
-- também registrar no histórico quando ELA MESMA oculta um produto por
-- estoque zerado — assim toda mudança de disponibilidade fica auditada,
-- manual ou automática, sem duplicar a regra de negócio original.
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
  v_status_atual boolean;
begin
  select business_id, is_available into v_business_id, v_status_atual
  from public.menu_items where id = p_menu_item_id;
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

  if v_sem_estoque and v_comportamento = 'ocultar' and v_status_atual then
    update public.menu_items set is_available = false where id = p_menu_item_id;
    insert into public.disponibilidade_historico (menu_item_id, business_id, user_id, status_anterior, status_novo, motivo)
    values (p_menu_item_id, v_business_id, null, true, false, 'Ingrediente sem estoque');
  end if;
end;
$$;
