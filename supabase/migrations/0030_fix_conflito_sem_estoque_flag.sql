-- Achado da auditoria pós-redesign de Insumos: sem_estoque_ingrediente é
-- reaproveitado por DOIS mecanismos independentes (ficha técnica, 0024, e
-- estoque direto, 0028). Um item configurado com os dois ao mesmo tempo
-- tinha um bug real: qualquer mudança de estoque num insumo da ficha
-- técnica chamava recalcular_disponibilidade_ingrediente(), que recalculava
-- a coluna olhando SÓ a ficha técnica — podia voltar pra false mesmo com o
-- estoque direto (estoque_itens) ainda zerado, fazendo o item reaparecer
-- como disponível indevidamente.
--
-- Fix: recalcular_disponibilidade_ingrediente() agora combina os dois sinais
-- (ficha técnica OU estoque direto) antes de decidir a coluna — nunca abaixa
-- a flag por causa só de um dos dois lados.
create or replace function public.recalcular_disponibilidade_ingrediente(p_menu_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sem_estoque_ingrediente boolean;
  v_sem_estoque_item_direto boolean;
  v_comportamento text;
  v_business_id uuid;
begin
  select business_id into v_business_id from public.menu_items where id = p_menu_item_id;
  if v_business_id is null then
    return;
  end if;

  select estoque_comportamento into v_comportamento from public.businesses where id = v_business_id;

  select exists (
    select 1
    from public.ficha_tecnica_itens fti
    join public.insumos i on i.id = fti.insumo_id
    where fti.menu_item_id = p_menu_item_id and i.estoque_atual <= 0
  ) into v_sem_estoque_ingrediente;

  select coalesce(
    (select estoque_habilitado and estoque_atual <= 0 from public.estoque_itens where item_id = p_menu_item_id),
    false
  ) into v_sem_estoque_item_direto;

  update public.menu_items
  set sem_estoque_ingrediente = (v_sem_estoque_ingrediente or v_sem_estoque_item_direto)
  where id = p_menu_item_id;

  if v_sem_estoque_ingrediente and v_comportamento = 'ocultar' then
    update public.menu_items set is_available = false where id = p_menu_item_id;
  end if;
end;
$$;
