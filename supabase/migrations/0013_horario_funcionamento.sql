-- Horário de funcionamento estruturado por dia da semana. Antes só existia
-- um toggle manual (businesses.is_open) e um campo de texto livre
-- (opening_hours) sem nenhuma ligação entre os dois — o dono tinha que lembrar
-- de togglear todo dia. Agora, quem ativar usa_horario_programado tem o
-- status calculado sozinho a partir do horário atual (America/Belem).

alter table public.businesses
  add column if not exists usa_horario_programado boolean not null default false;

-- day_of_week segue a convenção de Date.getDay() no front (0=domingo ...
-- 6=sábado), pra não precisar converter nada na hora de calcular.
create table if not exists public.business_hours (
  business_id uuid not null references public.businesses(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  opens_at time,
  closes_at time,
  closed boolean not null default false,
  primary key (business_id, day_of_week)
);

alter table public.business_hours enable row level security;

-- Leitura pública: o cardápio do cliente precisa calcular aberto/fechado sem
-- login. Escrita só pelo admin do próprio negócio.
create policy business_hours_select_public on public.business_hours
  for select using (true);
create policy business_hours_write_own on public.business_hours
  for all using (public.is_business_admin(business_id)) with check (public.is_business_admin(business_id));
