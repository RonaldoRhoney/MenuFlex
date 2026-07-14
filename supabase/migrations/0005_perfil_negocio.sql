-- Perfil detalhado do negócio (menu "Minha Empresa" no painel) — logo e edições mais
-- específicas ficam disponíveis a partir de qualquer plano pago, checado no front via
-- checkPlanFeature(planFeatures, business.plan, 'logo_propria') (mesma feature já usada
-- pra cor de destaque em Configurações).
alter table public.businesses
  add column if not exists description text,
  add column if not exists address text,
  add column if not exists phone text,
  add column if not exists opening_hours text,
  add column if not exists logo_url text;

-- A logo é enviada pro bucket público "menu-images" (mesmo bucket das fotos do cardápio,
-- ver SETUP.md Passo 5), no caminho {business_id}/logo-{timestamp}.{ext}. O bucket
-- "público" só libera leitura (select) sem policy — escrita (insert/update/delete) sempre
-- precisa de policy explícita em storage.objects, daí as três abaixo.
create policy menu_images_insert_admin on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'menu-images'
    and public.is_business_admin(((storage.foldername(name))[1])::uuid)
  );

create policy menu_images_update_admin on storage.objects
  for update to authenticated
  using (
    bucket_id = 'menu-images'
    and public.is_business_admin(((storage.foldername(name))[1])::uuid)
  );

create policy menu_images_delete_admin on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'menu-images'
    and public.is_business_admin(((storage.foldername(name))[1])::uuid)
  );
