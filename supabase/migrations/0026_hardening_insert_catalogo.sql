-- ---------- MÉDIO: protege a criação de itens no catálogo compartilhado ----------
-- A policy de insert (0010) libera "with check (true)" pra qualquer autenticado
-- contribuir item novo — necessário pro autocomplete crescer sozinho. Mas isso
-- também deixava qualquer um inserir usage_count arbitrário (envenenando a
-- ordenação por popularidade pra outros negócios) ou nome vazio/preço negativo.
-- O trigger de update (0018) já protege edição depois de criado; este trigger
-- faz o mesmo tipo de saneamento no momento da criação.
create or replace function public.sanitize_menu_item_catalog_insert()
returns trigger
language plpgsql
as $$
begin
  if public.is_super_admin() then
    return new;
  end if;
  if new.name is null or length(trim(new.name)) = 0 then
    raise exception 'Nome do item do catálogo não pode ser vazio.';
  end if;
  if new.suggested_price is not null and new.suggested_price < 0 then
    raise exception 'Preço sugerido não pode ser negativo.';
  end if;
  -- Todo item novo entra com popularidade 1, igual ao seed original — só o
  -- reaproveitamento (update) que soma o contador de verdade.
  new.usage_count := 1;
  return new;
end;
$$;

drop trigger if exists trg_sanitize_menu_item_catalog_insert on public.menu_item_catalog;
create trigger trg_sanitize_menu_item_catalog_insert
  before insert on public.menu_item_catalog
  for each row execute function public.sanitize_menu_item_catalog_insert();
