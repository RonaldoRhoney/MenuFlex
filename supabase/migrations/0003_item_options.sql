-- Grupos de opções por item (ex.: "Ponto da carne", "Adicionais") — mesma ideia de
-- personalização usada no front (ver src/lib/mockData.ts e ItemOptionsModal.tsx).
-- Leitura pública (cardápio), escrita só admin do negócio dono do item — mesmo
-- padrão de RLS de menu_categories/menu_items em 0001_schema.sql.

create table if not exists public.menu_item_option_groups (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  name text not null,
  required boolean not null default false,
  multiple boolean not null default false,
  order_index int not null default 0
);

create table if not exists public.menu_item_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.menu_item_option_groups(id) on delete cascade,
  name text not null,
  price_delta numeric(10,2) not null default 0,
  order_index int not null default 0
);

alter table public.menu_item_option_groups enable row level security;
alter table public.menu_item_options enable row level security;

create policy menu_item_option_groups_select_public on public.menu_item_option_groups
  for select using (true);
create policy menu_item_option_groups_write_admin on public.menu_item_option_groups
  for all using (
    public.is_business_admin((select business_id from public.menu_items where id = menu_item_id))
  ) with check (
    public.is_business_admin((select business_id from public.menu_items where id = menu_item_id))
  );

create policy menu_item_options_select_public on public.menu_item_options
  for select using (true);
create policy menu_item_options_write_admin on public.menu_item_options
  for all using (
    public.is_business_admin((
      select mi.business_id from public.menu_items mi
      join public.menu_item_option_groups g on g.menu_item_id = mi.id
      where g.id = group_id
    ))
  ) with check (
    public.is_business_admin((
      select mi.business_id from public.menu_items mi
      join public.menu_item_option_groups g on g.menu_item_id = mi.id
      where g.id = group_id
    ))
  );
