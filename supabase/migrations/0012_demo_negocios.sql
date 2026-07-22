-- 5 negócios de demonstração, cobrindo segmentos diferentes (inclusive
-- multi-segmento), planos diferentes e um negócio fechado — pra dar pra ver
-- o comportamento da tela "Monte seu cardápio"/"Adicionar do catálogo" e do
-- redesign do cardápio do cliente (Cardapio.tsx) com dados variados.
--
-- Os auth.users já nascem com os tokens como string vazia (não null), ao
-- contrário do que a 0002_seed.sql fez originalmente — evita repetir o bug
-- corrigido em 0008_corrige_usuario_demo_auth.sql.

-- ============================================================
-- Expande o catálogo colaborativo (0010) com itens pros segmentos que ainda
-- não tinham cobertura (Padaria, Açaí, mais opções de Bar/Pizzaria), já
-- associando segment_id direto (não precisa do backfill por category_hint).
-- ============================================================
insert into public.menu_item_catalog (name, description, suggested_price, category_hint, segment_id, usage_count) values
  ('Pão Francês (unidade)', 'Crocante por fora, macio por dentro, assado na hora', 0.75, 'Pães', (select id from public.segments where slug = 'padaria'), 5),
  ('Pão de Queijo (unidade)', 'Receita mineira tradicional', 3.50, 'Pães', (select id from public.segments where slug = 'padaria'), 5),
  ('Bolo do Dia (fatia)', 'Sabor variado conforme o dia — consulte no balcão', 8.00, 'Pães', (select id from public.segments where slug = 'padaria'), 3),
  ('Café Coado', 'Coado na hora, 200ml', 4.50, 'Bebidas', (select id from public.segments where slug = 'padaria'), 4),
  ('Cerveja Long Neck', 'Skol, Brahma, Antarctica ou Heineken', 8.00, 'Bebidas', (select id from public.segments where slug = 'bar'), 5),
  ('Chopp (300ml)', 'Chopp gelado tirado na hora', 9.00, 'Bebidas', (select id from public.segments where slug = 'bar'), 4),
  ('Isca de Peixe (porção)', 'Filé de peixe empanado, porção pra compartilhar', 32.00, 'Acompanhamentos', (select id from public.segments where slug = 'bar'), 3),
  ('Pizza Margherita', 'Molho de tomate, mussarela e manjericão fresco', 42.00, 'Pizzas', (select id from public.segments where slug = 'pizzaria'), 5),
  ('Pizza Calabresa', 'Calabresa fatiada, cebola e azeitona', 44.00, 'Pizzas', (select id from public.segments where slug = 'pizzaria'), 5),
  ('Pizza de Chocolate', 'Chocolate ao leite com granulado, sabor doce', 40.00, 'Pizzas', (select id from public.segments where slug = 'pizzaria'), 2),
  ('Açaí no Copo (500ml)', 'Açaí puro batido, sem xarope', 18.00, 'Açaí', (select id from public.segments where slug = 'acai'), 4),
  ('Granola (complemento)', 'Porção extra de granola crocante', 2.50, 'Complementos', (select id from public.segments where slug = 'acai'), 4),
  ('Leite Condensado (complemento)', 'Porção extra de leite condensado', 2.50, 'Complementos', (select id from public.segments where slug = 'acai'), 4),
  ('Banana (complemento)', 'Porção extra de banana fatiada', 2.00, 'Complementos', (select id from public.segments where slug = 'acai'), 3),
  ('Paçoca Triturada (complemento)', 'Porção extra de paçoca triturada', 2.00, 'Complementos', (select id from public.segments where slug = 'acai'), 3),
  ('Pudim de Leite', 'Fatia de pudim de leite condensado', 9.00, 'Sobremesas', (select id from public.segments where slug = 'restaurante'), 3),
  ('Brownie com Sorvete', 'Brownie quente com bola de sorvete de creme', 14.00, 'Sobremesas', (select id from public.segments where slug = 'restaurante'), 3)
on conflict (lower(name)) do nothing;

do $$
declare
  v_owner_padaria uuid := '00000000-0000-0000-0000-000000000010';
  v_owner_bar uuid := '00000000-0000-0000-0000-000000000011';
  v_owner_pizzaria uuid := '00000000-0000-0000-0000-000000000012';
  v_owner_acai uuid := '00000000-0000-0000-0000-000000000013';
  v_owner_chef uuid := '00000000-0000-0000-0000-000000000014';

  v_business_id uuid;
  v_cat_id uuid;
begin
  -- ============================================================
  -- Usuários demo (um por negócio) — mesmo padrão de 0002_seed.sql, já com
  -- os tokens como '' desde a criação.
  -- ============================================================
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  )
  select v.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v.email,
         crypt('menuflex-demo', gen_salt('bf')), now(), now(), now(),
         '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
         '', '', '', '', '', '', '', ''
  from (values
    (v_owner_padaria, 'aurora@padaria.demo.menuflex.app'),
    (v_owner_bar, 'nardo@bar.demo.menuflex.app'),
    (v_owner_pizzaria, 'bellaroma@pizzaria.demo.menuflex.app'),
    (v_owner_acai, 'ilha@acai.demo.menuflex.app'),
    (v_owner_chef, 'chef@restaurante.demo.menuflex.app')
  ) as v(id, email)
  where not exists (select 1 from auth.users where auth.users.id = v.id);

  -- ============================================================
  -- 1) Padaria Aurora — 1 segmento, plano básico, aberta
  -- ============================================================
  insert into public.businesses (owner_id, name, slug, type, plan, lat, lng, is_open, description)
  values (v_owner_padaria, 'Padaria Aurora', 'padaria-aurora', 'outro', 'basico', -1.4520, -48.4880, true,
          'Pão quentinho e café fresco desde as 6h da manhã')
  on conflict (slug) do update set name = excluded.name
  returning id into v_business_id;

  insert into public.business_segments (business_id, segment_id)
  values (v_business_id, (select id from public.segments where slug = 'padaria'))
  on conflict do nothing;

  insert into public.menu_categories (business_id, name, order_index) values (v_business_id, 'Pães', 0) returning id into v_cat_id;
  insert into public.menu_items (business_id, category_id, name, description, price, order_index, origem_catalogo_id, veio_do_catalogo)
  select v_business_id, v_cat_id, c.name, c.description, c.suggested_price, row_number() over () - 1, c.id, true
  from public.menu_item_catalog c where c.name in ('Pão Francês (unidade)', 'Pão de Queijo (unidade)', 'Bolo do Dia (fatia)');

  insert into public.menu_categories (business_id, name, order_index) values (v_business_id, 'Salgados', 1) returning id into v_cat_id;
  insert into public.menu_items (business_id, category_id, name, description, price, order_index, origem_catalogo_id, veio_do_catalogo)
  select v_business_id, v_cat_id, c.name, c.description, c.suggested_price, row_number() over () - 1, c.id, true
  from public.menu_item_catalog c where c.name in ('Coxinha de Frango (unidade)', 'Pastel de Queijo (unidade)');

  insert into public.menu_categories (business_id, name, order_index) values (v_business_id, 'Bebidas', 2) returning id into v_cat_id;
  insert into public.menu_items (business_id, category_id, name, description, price, order_index, origem_catalogo_id, veio_do_catalogo)
  select v_business_id, v_cat_id, c.name, c.description, c.suggested_price, row_number() over () - 1, c.id, true
  from public.menu_item_catalog c where c.name in ('Café Coado', 'Refrigerante Lata', 'Água Mineral');

  -- ============================================================
  -- 2) Bar do Nardo — 1 segmento, plano free, aberto
  -- ============================================================
  insert into public.businesses (owner_id, name, slug, type, plan, lat, lng, is_open, description)
  values (v_owner_bar, 'Bar do Nardo', 'bar-do-nardo', 'bar', 'free', -1.4498, -48.4850, true,
          'Bar de bairro, chopp gelado e petisco na medida')
  on conflict (slug) do update set name = excluded.name
  returning id into v_business_id;

  insert into public.business_segments (business_id, segment_id)
  values (v_business_id, (select id from public.segments where slug = 'bar'))
  on conflict do nothing;

  insert into public.menu_categories (business_id, name, order_index) values (v_business_id, 'Bebidas', 0) returning id into v_cat_id;
  insert into public.menu_items (business_id, category_id, name, description, price, order_index, origem_catalogo_id, veio_do_catalogo)
  select v_business_id, v_cat_id, c.name, c.description, c.suggested_price, row_number() over () - 1, c.id, true
  from public.menu_item_catalog c where c.name in ('Cerveja Long Neck', 'Chopp (300ml)', 'Refrigerante Lata', 'Água Mineral');

  insert into public.menu_categories (business_id, name, order_index) values (v_business_id, 'Acompanhamentos', 1) returning id into v_cat_id;
  insert into public.menu_items (business_id, category_id, name, description, price, order_index, origem_catalogo_id, veio_do_catalogo)
  select v_business_id, v_cat_id, c.name, c.description, c.suggested_price, row_number() over () - 1, c.id, true
  from public.menu_item_catalog c where c.name in ('Isca de Peixe (porção)', 'Batata Frita (porção)', 'Anéis de Cebola (porção)');

  -- ============================================================
  -- 3) Pizzaria Bella Roma — 1 segmento, plano premium, FECHADA (testa o
  -- estado "Fechado no momento" no redesign do cardápio)
  -- ============================================================
  insert into public.businesses (owner_id, name, slug, type, plan, lat, lng, is_open, description)
  values (v_owner_pizzaria, 'Pizzaria Bella Roma', 'pizzaria-bella-roma', 'outro', 'premium', -1.4570, -48.4920, false,
          'Massa fina, forno a lenha, tradição italiana')
  on conflict (slug) do update set name = excluded.name
  returning id into v_business_id;

  insert into public.business_segments (business_id, segment_id)
  values (v_business_id, (select id from public.segments where slug = 'pizzaria'))
  on conflict do nothing;

  insert into public.menu_categories (business_id, name, order_index) values (v_business_id, 'Pizzas', 0) returning id into v_cat_id;
  insert into public.menu_items (business_id, category_id, name, description, price, order_index, origem_catalogo_id, veio_do_catalogo)
  select v_business_id, v_cat_id, c.name, c.description, c.suggested_price, row_number() over () - 1, c.id, true
  from public.menu_item_catalog c where c.name in ('Pizza Margherita', 'Pizza Calabresa', 'Pizza Broto', 'Pizza de Chocolate');

  insert into public.menu_categories (business_id, name, order_index) values (v_business_id, 'Bebidas', 1) returning id into v_cat_id;
  insert into public.menu_items (business_id, category_id, name, description, price, order_index, origem_catalogo_id, veio_do_catalogo)
  select v_business_id, v_cat_id, c.name, c.description, c.suggested_price, row_number() over () - 1, c.id, true
  from public.menu_item_catalog c where c.name in ('Refrigerante Lata', 'Água Mineral');

  -- ============================================================
  -- 4) Açaí da Ilha — 1 segmento, plano básico, aberto
  -- ============================================================
  insert into public.businesses (owner_id, name, slug, type, plan, lat, lng, is_open, description)
  values (v_owner_acai, 'Açaí da Ilha', 'acai-da-ilha', 'outro', 'basico', -1.4540, -48.4870, true,
          'Açaí da roça, batido na hora, direto do Marajó')
  on conflict (slug) do update set name = excluded.name
  returning id into v_business_id;

  insert into public.business_segments (business_id, segment_id)
  values (v_business_id, (select id from public.segments where slug = 'acai'))
  on conflict do nothing;

  insert into public.menu_categories (business_id, name, order_index) values (v_business_id, 'Açaí', 0) returning id into v_cat_id;
  insert into public.menu_items (business_id, category_id, name, description, price, order_index, origem_catalogo_id, veio_do_catalogo)
  select v_business_id, v_cat_id, c.name, c.description, c.suggested_price, row_number() over () - 1, c.id, true
  from public.menu_item_catalog c where c.name in ('Açaí na Tigela (300ml)', 'Açaí no Copo (500ml)');

  insert into public.menu_categories (business_id, name, order_index) values (v_business_id, 'Complementos', 1) returning id into v_cat_id;
  insert into public.menu_items (business_id, category_id, name, description, price, order_index, origem_catalogo_id, veio_do_catalogo)
  select v_business_id, v_cat_id, c.name, c.description, c.suggested_price, row_number() over () - 1, c.id, true
  from public.menu_item_catalog c where c.name in ('Granola (complemento)', 'Leite Condensado (complemento)', 'Banana (complemento)', 'Paçoca Triturada (complemento)');

  insert into public.menu_categories (business_id, name, order_index) values (v_business_id, 'Bebidas', 2) returning id into v_cat_id;
  insert into public.menu_items (business_id, category_id, name, description, price, order_index, origem_catalogo_id, veio_do_catalogo)
  select v_business_id, v_cat_id, c.name, c.description, c.suggested_price, row_number() over () - 1, c.id, true
  from public.menu_item_catalog c where c.name in ('Suco Natural (500ml)', 'Água Mineral');

  -- ============================================================
  -- 5) Point do Chef — MULTI-segmento (Restaurante + Hamburgueria), plano
  -- premium, aberto, 5 categorias (testa o scroll da navegação por
  -- categorias no redesign)
  -- ============================================================
  insert into public.businesses (owner_id, name, slug, type, plan, lat, lng, is_open, description)
  values (v_owner_chef, 'Point do Chef', 'point-do-chef', 'restaurante', 'premium', -1.4560, -48.4910, true,
          'Do lanche ao prato completo — cardápio grande, tudo feito na hora')
  on conflict (slug) do update set name = excluded.name
  returning id into v_business_id;

  insert into public.business_segments (business_id, segment_id)
  values (v_business_id, (select id from public.segments where slug = 'restaurante')),
         (v_business_id, (select id from public.segments where slug = 'hamburgueria'))
  on conflict do nothing;

  insert into public.menu_categories (business_id, name, order_index) values (v_business_id, 'Lanches', 0) returning id into v_cat_id;
  insert into public.menu_items (business_id, category_id, name, description, price, order_index, origem_catalogo_id, veio_do_catalogo)
  select v_business_id, v_cat_id, c.name, c.description, c.suggested_price, row_number() over () - 1, c.id, true
  from public.menu_item_catalog c where c.name in ('X-Tudo', 'X-Bacon', 'X-Salada');

  insert into public.menu_categories (business_id, name, order_index) values (v_business_id, 'Salgados', 1) returning id into v_cat_id;
  insert into public.menu_items (business_id, category_id, name, description, price, order_index, origem_catalogo_id, veio_do_catalogo)
  select v_business_id, v_cat_id, c.name, c.description, c.suggested_price, row_number() over () - 1, c.id, true
  from public.menu_item_catalog c where c.name in ('Coxinha de Frango (unidade)', 'Pastel de Carne (unidade)');

  insert into public.menu_categories (business_id, name, order_index) values (v_business_id, 'Acompanhamentos', 2) returning id into v_cat_id;
  insert into public.menu_items (business_id, category_id, name, description, price, order_index, origem_catalogo_id, veio_do_catalogo)
  select v_business_id, v_cat_id, c.name, c.description, c.suggested_price, row_number() over () - 1, c.id, true
  from public.menu_item_catalog c where c.name in ('Batata Frita com Cheddar e Bacon', 'Anéis de Cebola (porção)');

  insert into public.menu_categories (business_id, name, order_index) values (v_business_id, 'Sobremesas', 3) returning id into v_cat_id;
  insert into public.menu_items (business_id, category_id, name, description, price, order_index, origem_catalogo_id, veio_do_catalogo)
  select v_business_id, v_cat_id, c.name, c.description, c.suggested_price, row_number() over () - 1, c.id, true
  from public.menu_item_catalog c where c.name in ('Pudim de Leite', 'Brownie com Sorvete', 'Açaí na Tigela (300ml)');

  insert into public.menu_categories (business_id, name, order_index) values (v_business_id, 'Bebidas', 4) returning id into v_cat_id;
  insert into public.menu_items (business_id, category_id, name, description, price, order_index, origem_catalogo_id, veio_do_catalogo)
  select v_business_id, v_cat_id, c.name, c.description, c.suggested_price, row_number() over () - 1, c.id, true
  from public.menu_item_catalog c where c.name in ('Refrigerante Lata', 'Água Mineral', 'Suco Natural (500ml)', 'Milk Shake');
end $$;
