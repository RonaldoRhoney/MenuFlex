-- Catálogo compartilhado de itens de cardápio: sugestões de nome/descrição/preço
-- que aparecem como autocomplete ao cadastrar um item, e crescem sozinhas — cada
-- negócio que cadastra um item novo (que ainda não existia no catálogo) contribui
-- pra lista de todo mundo. usage_count ordena as sugestões por popularidade.
--
-- Não é uma IA de verdade (sem custo de API externa) — é um dicionário
-- colaborativo simples que fica mais útil conforme mais negócios usam a plataforma.

create table if not exists public.menu_item_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  suggested_price numeric(10,2),
  category_hint text,
  usage_count int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists menu_item_catalog_name_lower_idx on public.menu_item_catalog (lower(name));
create index if not exists menu_item_catalog_usage_idx on public.menu_item_catalog (usage_count desc);

alter table public.menu_item_catalog enable row level security;

-- Leitura pública (mesmo padrão de plan_features): é só um dicionário de nomes de
-- comida, sem dado sensível, e o autocomplete precisa funcionar pra qualquer
-- negócio logado sem fricção.
create policy menu_item_catalog_select_public on public.menu_item_catalog
  for select using (true);

-- Qualquer admin de negócio autenticado pode contribuir (inserir item novo) ou
-- incrementar o contador de uso de um item existente que reaproveitou.
create policy menu_item_catalog_insert_authenticated on public.menu_item_catalog
  for insert to authenticated with check (true);

create policy menu_item_catalog_update_authenticated on public.menu_item_catalog
  for update to authenticated using (true) with check (true);

-- ============================================================
-- LISTA PRÉ-PRONTA — itens comuns de lanchonete/restaurante brasileiro, pra não
-- começar vazia. Preço é só sugestão de referência (o dono ajusta ao adicionar).
-- ============================================================
insert into public.menu_item_catalog (name, description, suggested_price, category_hint, usage_count) values
  ('X-Tudo', 'Pão, hambúrguer, presunto, queijo, ovo, bacon, alface, tomate, milho e batata palha', 24.90, 'Lanches', 5),
  ('X-Salada', 'Hambúrguer, queijo, alface, tomate e maionese da casa', 18.90, 'Lanches', 5),
  ('X-Bacon', 'Hambúrguer, queijo, bacon crocante e molho barbecue', 21.90, 'Lanches', 5),
  ('X-Frango', 'Filé de frango grelhado, queijo, alface e tomate', 19.90, 'Lanches', 3),
  ('Misto Quente na Chapa', 'Pão de forma, presunto e queijo prensados na chapa', 9.50, 'Lanches', 5),
  ('Cachorro-Quente Completo', 'Pão, salsicha, molho, milho, batata palha, queijo e maionese', 14.90, 'Lanches', 4),
  ('Coxinha de Frango (unidade)', 'Massa cremosa recheada com frango desfiado', 7.00, 'Salgados', 5),
  ('Pastel de Carne (unidade)', 'Massa crocante frita na hora', 8.00, 'Salgados', 4),
  ('Pastel de Queijo (unidade)', 'Massa crocante frita na hora', 7.50, 'Salgados', 4),
  ('Kibe (unidade)', 'Salgado à base de trigo e carne temperada', 6.50, 'Salgados', 3),
  ('Batata Frita (porção)', 'Porção individual de batata frita crocante', 15.00, 'Acompanhamentos', 5),
  ('Batata Frita com Cheddar e Bacon', 'Porção de batata frita com cheddar cremoso e bacon', 22.00, 'Acompanhamentos', 4),
  ('Anéis de Cebola (porção)', 'Onion rings empanados e crocantes', 16.00, 'Acompanhamentos', 2),
  ('Refrigerante Lata', 'Coca-Cola, Guaraná, Fanta ou similar', 6.00, 'Bebidas', 5),
  ('Água Mineral', 'Com ou sem gás, 500ml', 4.00, 'Bebidas', 5),
  ('Suco Natural (500ml)', 'Polpa de fruta batida na hora — cupuaçu, açaí, maracujá', 8.00, 'Bebidas', 4),
  ('Milk Shake', 'Chocolate, morango ou baunilha, 400ml', 15.00, 'Bebidas', 3),
  ('Açaí na Tigela (300ml)', 'Açaí batido com xarope de guaraná, acompanha farinha e banana', 14.90, 'Sobremesas', 4),
  ('Pizza Broto', 'Massa fina, tamanho individual — sabor à escolha', 22.00, 'Pizzas', 3),
  ('Esfiha Aberta (unidade)', 'Massa fina com recheio de carne ou queijo', 6.50, 'Salgados', 2)
on conflict (lower(name)) do nothing;
