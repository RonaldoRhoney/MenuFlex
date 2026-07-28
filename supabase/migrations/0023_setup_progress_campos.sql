-- Fase 1 do roteiro Smart Setup Validation: campos novos usados no cálculo
-- de progresso do módulo "Empresa". Todos nullable — nenhum negócio
-- existente quebra, só aparecem como pendência no cálculo de %.
alter table public.businesses
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists pix_key text,
  add column if not exists instagram text,
  add column if not exists facebook text,
  add column if not exists delivery_fee numeric(10,2);
