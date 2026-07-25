-- Módulo de Estoque (mapa de calor), exclusivo do plano Básico em diante.
--
-- Tabela separada de menu_items (não colunas nela): menu_items tem select
-- público (cliente final lê o cardápio inteiro), e esconder quantidade/limite
-- de estoque nesse mesmo select exigiria segurança por coluna (Postgres RLS
-- não faz isso nativamente) ou uma view intermediária. Tabela própria = RLS
-- simples, sem select público nenhum — cliente final nunca lê estoque.

create table if not exists public.estoque_itens (
  item_id uuid primary key references public.menu_items(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  estoque_atual numeric(10,2) not null default 0 check (estoque_atual >= 0),
  estoque_minimo numeric(10,2) not null default 0 check (estoque_minimo >= 0),
  estoque_habilitado boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.estoque_itens enable row level security;

-- Sem select público: só admin do negócio, e só com a feature de plano
-- habilitada — o gate de plano é validado aqui, não só escondido na UI.
-- Uma única policy "for all" cobre select/insert/update/delete, já que a
-- condição é idêntica pras quatro operações (diferente de menu_items, que
-- tem select público e por isso precisa de duas policies distintas).
create policy estoque_itens_admin on public.estoque_itens
  for all using (
    public.is_business_admin(business_id)
    and public.check_plan_feature(business_id, 'controle_estoque')
  )
  with check (
    public.is_business_admin(business_id)
    and public.check_plan_feature(business_id, 'controle_estoque')
  );

-- Feature key nova em plan_features: livre no básico/premium, indisponível no free.
insert into public.plan_features (plan, feature_key, enabled, usage_limit) values
  ('free',    'controle_estoque', false, null),
  ('basico',  'controle_estoque', true,  null),
  ('premium', 'controle_estoque', true,  null)
on conflict (plan, feature_key) do nothing;

-- "Zerou → marca indisponível" mora aqui, na própria estoque_itens, não no
-- trigger de pedidos — assim cobre os DOIS jeitos de chegar a zero: débito
-- automático por pedido E edição manual do lojista na tela de Estoque, sem
-- duplicar a regra em dois lugares.
create or replace function public.handle_estoque_zerado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estoque_habilitado and new.estoque_atual = 0
     and (old.estoque_atual is distinct from new.estoque_atual or old.estoque_habilitado is distinct from new.estoque_habilitado) then
    update public.menu_items set is_available = false where id = new.item_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_estoque_zerado on public.estoque_itens;
create trigger on_estoque_zerado
  after update of estoque_atual, estoque_habilitado on public.estoque_itens
  for each row execute function public.handle_estoque_zerado();

-- Débito automático de estoque ao pedido entrar em "preparo" (é quando a
-- cozinha realmente compromete o insumo — "recebido" ainda pode ser
-- recusado). Estorno automático se um pedido já debitado for cancelado.
-- UPDATE é atômico (lock de linha implícito do Postgres): dois pedidos
-- simultâneos do mesmo item não geram condição de corrida nem estoque
-- negativo — o "greatest(...,0)" só evita ir abaixo de zero por segurança
-- extra, o check constraint da coluna já impediria negativo de qualquer forma.
-- Zerar aqui também dispara on_estoque_zerado acima, sem duplicar a regra.
create or replace function public.handle_order_stock_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then

    if new.status = 'preparo' then
      update public.estoque_itens ei
      set estoque_atual = greatest(ei.estoque_atual - oi.quantity, 0),
          updated_at = now()
      from public.order_items oi
      where oi.order_id = new.id
        and ei.item_id = oi.menu_item_id
        and ei.estoque_habilitado = true;

    elsif new.status = 'cancelado' and old.status in ('preparo', 'pronto', 'entregue') then
      -- Só estorna se o débito já tinha acontecido (pedido passou por "preparo").
      update public.estoque_itens ei
      set estoque_atual = ei.estoque_atual + oi.quantity,
          updated_at = now()
      from public.order_items oi
      where oi.order_id = new.id
        and ei.item_id = oi.menu_item_id
        and ei.estoque_habilitado = true;
    end if;

  end if;
  return new;
end;
$$;

drop trigger if exists on_order_stock_change on public.orders;
create trigger on_order_stock_change
  after update of status on public.orders
  for each row execute function public.handle_order_stock_change();
