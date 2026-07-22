-- Só existia a policy businesses_delete_owner (dono exclui o próprio
-- negócio) — a Gerência RhoneyInc (super-admin) não conseguia excluir
-- nenhum negócio de terceiros. Necessário pro botão "Excluir" na aba
-- Negócios do painel de gerência.
create policy businesses_delete_super_admin on public.businesses
  for delete using (public.is_super_admin());
