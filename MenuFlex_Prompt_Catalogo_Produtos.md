# Prompt para Claude Code — MenuFlex: Catálogo de Produtos Pré-Cadastrados por Segmento

## Contexto

O MenuFlex é um PWA multi-tenant de cardápio digital para pequenos, médios e grandes negócios de bairro (Belém e outras cidades). Cada negócio (tenant) escolhe um ou mais **segmentos** no cadastro (ex: Lanchonete, Bar, Pizzaria, Açaí, Padaria) e o sistema já sugere um catálogo de produtos típicos daquele segmento, para o dono só marcar o que vende, ajustar preço/foto e publicar — sem digitar tudo do zero.

Um negócio pode pertencer a **mais de um segmento ao mesmo tempo** (ex: uma lanchonete que também vende cerveja, refrigerante e água deve enxergar produtos de "Lanches" e de "Bar/Bebidas" juntos).

## Regras padrão RhoneyInc (seguir sempre)
1. Toda tela deve ser responsiva.
2. Rodapé com "Copyright @RhoneyInc" em todas as páginas.
3. Antes de gerar o código, apresente o plano técnico (schema, telas, fluxo) para eu validar. Só depois de eu confirmar, gere o código.

---

## Objetivo da feature

1. Existe um **catálogo global de produtos** (mantido pela RhoneyInc, não por tenant), organizado por segmento e por categoria de produto (ex: dentro de "Bar": Cerveja, Refrigerante, Água, Destilados, Drinks).
2. No onboarding (ou depois, em "Configurações > Segmentos"), o dono do negócio:
   - Seleciona um ou mais segmentos que definem seu negócio.
   - O sistema mostra, agrupado por segmento e por categoria, todos os produtos do catálogo global correspondentes.
   - O dono marca (checkbox/toggle) quais produtos quer ativar no seu cardápio.
   - Para cada produto marcado, define preço (obrigatório) e pode customizar nome, descrição, foto (opcional — senão usa os dados padrão do catálogo).
3. O dono também pode adicionar produtos totalmente novos, que não existem no catálogo (fluxo já existente do MenuFlex, não mexer).
4. Produtos do catálogo global adicionados por um tenant viram registros próprios na tabela de produtos do negócio (cópia + referência ao catálogo, não um vínculo "live" — se o catálogo global mudar depois, não deve alterar o que o tenant já publicou).

## Modelo de dados (Supabase/Postgres) — proposto

```sql
-- Segmentos de negócio (ex: Lanchonete, Bar, Pizzaria, Açaí, Padaria)
create table segmentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  slug text not null unique,
  icone text, -- nome do ícone (lucide-react)
  ordem int default 0,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- Categorias de produto DENTRO de um segmento (ex: Cerveja, Refrigerante, Lanches, Porções)
create table categorias_produto_catalogo (
  id uuid primary key default gen_random_uuid(),
  segmento_id uuid references segmentos(id) on delete cascade,
  nome text not null,
  ordem int default 0,
  created_at timestamptz default now()
);

-- Catálogo global de produtos pré-cadastrados
create table produtos_catalogo (
  id uuid primary key default gen_random_uuid(),
  categoria_produto_id uuid references categorias_produto_catalogo(id) on delete cascade,
  nome text not null,
  descricao text,
  imagem_url text,
  preco_sugerido numeric(10,2), -- apenas referência, tenant define o real
  ordem int default 0,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- Vínculo negócio <-> segmentos escolhidos
create table negocio_segmentos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid references negocios(id) on delete cascade,
  segmento_id uuid references segmentos(id) on delete cascade,
  created_at timestamptz default now(),
  unique(negocio_id, segmento_id)
);

-- Produto final do negócio (já existente no MenuFlex — só adicionar as colunas abaixo se não existirem)
alter table produtos_negocio
  add column if not exists origem_catalogo_id uuid references produtos_catalogo(id),
  add column if not exists veio_do_catalogo boolean default false;
```

### RLS
- `segmentos`, `categorias_produto_catalogo`, `produtos_catalogo`: leitura pública (todos os tenants podem ler o catálogo), escrita restrita a admin (`is_admin()`).
- `negocio_segmentos`, `produtos_negocio`: RLS padrão já usada no MenuFlex (tenant só acessa o que é dele), respeitando `check_plan_feature()` onde aplicável (ex: limite de produtos por plano).

## Fluxo de tela

**Onboarding / Configurações > Segmentos:**
1. Grid de cards com os segmentos disponíveis (multi-seleção, toggle visual tipo "chip selecionado").
2. Botão "Continuar" → vai para "Monte seu cardápio".

**Monte seu cardápio (a partir do catálogo):**
1. Abas ou accordion por segmento selecionado.
2. Dentro de cada segmento, seções por categoria de produto (ex: "Bebidas > Cerveja").
3. Lista de produtos do catálogo com: imagem, nome, descrição curta, checkbox "adicionar ao meu cardápio" + campo de preço que aparece ao marcar.
4. Contador fixo no rodapé mobile: "X produtos selecionados" + botão "Salvar e publicar".
5. Ao salvar: cria os registros em `produtos_negocio` com `veio_do_catalogo = true` e `origem_catalogo_id` apontando pro catálogo.

**Depois do onboarding:** o mesmo catálogo deve ficar acessível em "Meus Produtos > Adicionar do catálogo", pro dono incluir novos itens depois.

## Dados de seed (exemplos mínimos pra popular o catálogo)

- **Segmento: Lanchonete** → categorias: Lanches, Porções, Sobremesas
  - Lanches: X-Burguer, X-Salada, X-Bacon, X-Tudo, Misto Quente, Cachorro-Quente
  - Porções: Batata Frita, Frango a Passarinho, Isca de Peixe
- **Segmento: Bar** → categorias: Cerveja, Refrigerante, Água, Destilados, Drinks
  - Cerveja: Skol, Brahma, Antarctica, Heineken (long neck e lata)
  - Refrigerante: Coca-Cola, Guaraná Antarctica, Fanta
  - Água: Água com gás, Água sem gás
- **Segmento: Pizzaria** → categorias: Pizzas Salgadas, Pizzas Doces, Bebidas
- **Segmento: Açaí** → categorias: Açaí (tamanhos), Complementos (granola, leite condensado, banana)

(Claude Code deve gerar uma seed mais completa, cobrindo pelo menos 15-20 produtos por segmento, com base nesses exemplos.)

## O que entregar

1. Plano técnico resumido (confirmar comigo antes de codar).
2. Migrations SQL completas (tabelas acima + RLS + seed inicial).
3. Componentes de tela (React) para: seleção de segmentos e montagem do cardápio a partir do catálogo.
4. Lógica de salvamento (copiar produto do catálogo pra `produtos_negocio`).
5. Respeitar responsividade e rodapé "Copyright @RhoneyInc" em todas as telas novas.
