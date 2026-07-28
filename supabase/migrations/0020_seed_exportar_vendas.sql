-- Libera exportação de vendas (PDF/XLSX) em Analytics para os planos
-- Básico e Premium, seguindo o mesmo padrão de plan_features do 0002_seed.sql.
insert into public.plan_features (plan, feature_key, enabled, usage_limit) values
  ('free',    'exportar_vendas', false, null),
  ('basico',  'exportar_vendas', true,  null),
  ('premium', 'exportar_vendas', true,  null)
on conflict (plan, feature_key) do update set
  enabled = excluded.enabled,
  usage_limit = excluded.usage_limit;
