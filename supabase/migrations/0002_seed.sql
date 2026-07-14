-- MenuFlex — dados de demonstração/teste
-- Negócio fictício "Point do Zé" + plan_features das 3 faixas de plano.

-- ============================================================
-- PLAN FEATURES
-- ============================================================

insert into public.plan_features (plan, feature_key, enabled, usage_limit) values
  ('free',    'cardapio_digital',       true,  null),
  ('free',    'pedido_retirada',        true,  30),
  ('free',    'pedido_local',           false, null),
  ('free',    'delivery',               false, null),
  ('free',    'instalacao_proximidade', true,  100),
  ('free',    'logo_propria',           false, null),
  ('free',    'identidade_completa',    false, null),
  ('free',    'push_notifications',     false, null),
  ('free',    'analytics_basico',       false, null),
  ('free',    'analytics_avancado',     false, null),
  ('free',    'multiplas_unidades',     false, null),

  ('basico',  'cardapio_digital',       true,  null),
  ('basico',  'pedido_retirada',        true,  null),
  ('basico',  'pedido_local',           true,  null),
  ('basico',  'delivery',               true,  null),
  ('basico',  'instalacao_proximidade', true,  300),
  ('basico',  'logo_propria',           true,  null),
  ('basico',  'identidade_completa',    false, null),
  ('basico',  'push_notifications',     false, null),
  ('basico',  'analytics_basico',       true,  null),
  ('basico',  'analytics_avancado',     false, null),
  ('basico',  'multiplas_unidades',     false, null),

  ('premium', 'cardapio_digital',       true,  null),
  ('premium', 'pedido_retirada',        true,  null),
  ('premium', 'pedido_local',           true,  null),
  ('premium', 'delivery',               true,  null),
  ('premium', 'instalacao_proximidade', true,  500),
  ('premium', 'logo_propria',           true,  null),
  ('premium', 'identidade_completa',    true,  null),
  ('premium', 'push_notifications',     true,  null),
  ('premium', 'analytics_basico',       true,  null),
  ('premium', 'analytics_avancado',     true,  null),
  ('premium', 'multiplas_unidades',     true,  null)
on conflict (plan, feature_key) do update set
  enabled = excluded.enabled,
  usage_limit = excluded.usage_limit;

-- ============================================================
-- NEGÓCIO DE DEMONSTRAÇÃO: "Point do Zé"
-- ============================================================
-- Precisa de um auth.users para ser owner. Em ambiente local
-- (`supabase db reset`) este insert roda com privilégios totais.
-- Em um projeto hospedado, rode este bloco pelo SQL Editor (que usa a
-- role postgres) — não é possível via API pública/anon key.

do $$
declare
  v_owner_id uuid := '00000000-0000-0000-0000-000000000001';
  v_business_id uuid;
  v_categoria_lanches_id uuid;
begin
  if not exists (select 1 from auth.users where id = v_owner_id) then
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data
    ) values (
      v_owner_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'ze@pointdoze.demo.menuflex.app', crypt('menuflex-demo', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb
    );
  end if;

  insert into public.businesses (owner_id, name, slug, type, plan, lat, lng, is_open)
  values (v_owner_id, 'Point do Zé', 'point-do-ze', 'lanche_rua', 'basico', -1.4557, -48.4902, true)
  on conflict (slug) do update set name = excluded.name
  returning id into v_business_id;

  insert into public.menu_categories (business_id, name, order_index)
  values (v_business_id, 'Lanches', 0)
  returning id into v_categoria_lanches_id;

  insert into public.menu_items (business_id, category_id, name, description, price, order_index) values
    (v_business_id, v_categoria_lanches_id, 'X-Tudo do Zé',
     'Pão, hambúrguer 150g, presunto, queijo, ovo, bacon, alface, tomate, milho e batata palha',
     22.90, 0),
    (v_business_id, v_categoria_lanches_id, 'Misto Quente na Chapa',
     'Pão de forma, presunto e queijo prensados na chapa',
     9.50, 1),
    (v_business_id, v_categoria_lanches_id, 'Coxinha de Frango (unidade)',
     'Massa cremosa recheada com frango desfiado',
     7.00, 2),
    (v_business_id, v_categoria_lanches_id, 'Suco Natural de Cupuaçu (500ml)',
     'Polpa de cupuaçu batida na hora',
     8.00, 3),
    (v_business_id, v_categoria_lanches_id, 'Açaí na Tigela (300ml)',
     'Açaí batido com xarope de guaraná, acompanha farinha e banana',
     14.90, 4)
  on conflict do nothing;
end $$;
