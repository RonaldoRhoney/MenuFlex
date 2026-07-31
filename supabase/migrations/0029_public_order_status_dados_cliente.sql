-- Amplia get_public_order_status pra também devolver nome/telefone do
-- cliente, pra exibir na tela "Acompanhe seu pedido" (Nome, Telefone, Data
-- e Hora do pedido) sem precisar de login — o mesmo modelo de segurança já
-- em uso aqui: o UUID do pedido (imprevisível) funciona como a "chave" de
-- acesso a esse link, igual ao que o próprio lojista já vê no painel.
create or replace function public.get_public_order_status(p_order_id uuid)
returns table (
  id uuid,
  status text,
  order_type text,
  total numeric,
  created_at timestamptz,
  customer_name text,
  customer_phone text
)
language sql
security definer
set search_path = public
stable
as $$
  select o.id, o.status, o.order_type, o.total, o.created_at, c.name, c.phone
  from public.orders o
  left join public.customers c on c.id = o.customer_id
  where o.id = p_order_id;
$$;
