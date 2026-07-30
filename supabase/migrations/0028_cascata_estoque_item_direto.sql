-- Alinha a cascata de indisponibilidade do estoque por item direto
-- (estoque_itens, 0015_estoque.sql) com a que já existe pro caminho por
-- ingrediente (recalcular_disponibilidade_ingrediente, 0024). Hoje
-- handle_estoque_zerado() sempre escondia o item (is_available = false)
-- quando zerava, ignorando businesses.estoque_comportamento — ou seja, um
-- negócio que configurou "Mostrar como indisponível" ou "Vender mesmo
-- assim" via Configurações via era ignorado nesse caminho, só valia pro
-- caminho de ficha técnica.
--
-- Reaproveita a mesma coluna sem_estoque_ingrediente como sinal genérico de
-- "esse item não pode ser vendido agora por falta de estoque" — o cardápio
-- do cliente (cliente/Cardapio.tsx) já lê essa coluna pra badge/desabilitar
-- o botão, não importa se a origem foi ficha técnica ou controle direto.
create or replace function public.handle_estoque_zerado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comportamento text;
begin
  if new.estoque_habilitado and new.estoque_atual = 0
     and (old.estoque_atual is distinct from new.estoque_atual or old.estoque_habilitado is distinct from new.estoque_habilitado) then

    select estoque_comportamento into v_comportamento from public.businesses where id = new.business_id;

    if v_comportamento = 'ocultar' then
      update public.menu_items set is_available = false where id = new.item_id;
    elsif v_comportamento = 'indisponivel' then
      update public.menu_items set sem_estoque_ingrediente = true where id = new.item_id;
    end if;
    -- 'permitir': não faz nada — item continua vendável normalmente, igual
    -- ao caminho de ingrediente.
  end if;
  return new;
end;
$$;
