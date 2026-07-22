-- Multi-segmento por negócio, evoluindo o que já existe (businesses.type +
-- menu_item_catalog) em vez de criar um catálogo curado paralelo. Ver
-- MenuFlex_Prompt_Catalogo_Produtos.md para o pedido original — este schema é
-- a versão ajustada depois de conferir premissas contra o código real:
-- businesses.type já é um enum fixo de 5 valores (não os nomes "negocios" do
-- doc), e menu_item_catalog já é o catálogo colaborativo (não precisa de uma
-- segunda tabela de produtos).

-- ============================================================
-- SEGMENTOS — lista extensível controlada por super-admin, substitui o
-- enum fixo businesses.type pra fins de sugestão de cardápio (o enum em si
-- continua existindo, sem quebrar nada — só passa a ser legado/display).
-- ============================================================
create table if not exists public.segments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  icon text,
  order_index int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.segments enable row level security;

create policy segments_select_public on public.segments
  for select using (true);
create policy segments_write_super_admin on public.segments
  for all using (public.is_super_admin()) with check (public.is_super_admin());

insert into public.segments (name, slug, icon, order_index) values
  ('Lanchonete', 'lanchonete', 'sandwich', 1),
  ('Bar', 'bar', 'beer', 2),
  ('Restaurante', 'restaurante', 'utensils', 3),
  ('Hamburgueria', 'hamburgueria', 'beef', 4),
  ('Pizzaria', 'pizzaria', 'pizza', 5),
  ('Açaí', 'acai', 'ice-cream-bowl', 6),
  ('Padaria', 'padaria', 'croissant', 7),
  ('Outro', 'outro', 'store', 8)
on conflict (slug) do nothing;

-- ============================================================
-- BUSINESS_SEGMENTS — vínculo N:N (um negócio pode ter Lanchonete + Bar, por
-- exemplo). Aditivo: businesses.type continua obrigatório e sem migração de
-- dados arriscada.
-- ============================================================
create table if not exists public.business_segments (
  business_id uuid not null references public.businesses(id) on delete cascade,
  segment_id uuid not null references public.segments(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (business_id, segment_id)
);

alter table public.business_segments enable row level security;

-- mesmo padrão de business_admins: cardápio público não precisa ver os
-- segmentos, só o próprio admin do negócio gerencia.
create policy business_segments_select_own on public.business_segments
  for select using (public.is_business_admin(business_id));
create policy business_segments_insert_own on public.business_segments
  for insert with check (public.is_business_admin(business_id));
create policy business_segments_delete_own on public.business_segments
  for delete using (public.is_business_admin(business_id));

-- ============================================================
-- Enriquece o catálogo colaborativo já existente (0010) em vez de duplicar:
-- ganha imagem e um segmento "dono" opcional pra permitir agrupar a tela
-- "Monte seu cardápio" por segmento -> category_hint. Continua sem custo de
-- API externa e sem trocar a política de escrita colaborativa atual.
-- ============================================================
alter table public.menu_item_catalog
  add column if not exists image_url text,
  add column if not exists segment_id uuid references public.segments(id);

-- ============================================================
-- Rastreia origem no cardápio do negócio (cópia, não vínculo vivo — se o
-- catálogo mudar depois, o que o tenant já publicou não é afetado).
-- ============================================================
alter table public.menu_items
  add column if not exists origem_catalogo_id uuid references public.menu_item_catalog(id),
  add column if not exists veio_do_catalogo boolean not null default false;

-- ============================================================
-- Seed: associa os itens já existentes do catálogo (0010) aos segmentos
-- correspondentes, usando category_hint como ponte.
-- ============================================================
update public.menu_item_catalog set segment_id = (select id from public.segments where slug = 'lanchonete')
  where category_hint in ('Lanches', 'Salgados', 'Acompanhamentos') and segment_id is null;
update public.menu_item_catalog set segment_id = (select id from public.segments where slug = 'restaurante')
  where category_hint = 'Sobremesas' and segment_id is null;
update public.menu_item_catalog set segment_id = (select id from public.segments where slug = 'pizzaria')
  where category_hint = 'Pizzas' and segment_id is null;
update public.menu_item_catalog set segment_id = (select id from public.segments where slug = 'bar')
  where category_hint = 'Bebidas' and segment_id is null;
