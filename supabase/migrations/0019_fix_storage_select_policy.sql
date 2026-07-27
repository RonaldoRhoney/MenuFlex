-- Corrige upload de foto (logo do negócio e foto de item do cardápio) falhando
-- com "new row violates row-level security policy" mesmo com todos os dados
-- corretos (JWT válido, business_admins vinculado, política de insert certa).
--
-- Causa raiz: o bucket "menu-images" só tinha policies de insert/update/delete
-- (0005_perfil_negocio.sql) — nenhuma de SELECT pra usuários autenticados.
-- O client chama upload(..., { upsert: true }), e o upsert precisa checar se
-- já existe um arquivo com aquele nome antes de decidir entre inserir ou
-- atualizar — essa checagem é um SELECT em storage.objects, que sem policy
-- de select pra "authenticated" falha silenciosamente e é reportado como
-- violação de RLS genérica.
create policy menu_images_select_admin on storage.objects
  for select to authenticated
  using (
    bucket_id = 'menu-images'
    and public.is_business_admin(((storage.foldername(name))[1])::uuid)
  );
