# MenuFlex — Setup do Backend (Supabase)

MenuFlex usa um projeto Supabase **próprio** (não é o mesmo do RhoneyInc nem do MeuPet) — cada negócio cadastrado no MenuFlex é uma linha na tabela `businesses` desse projeto, isolada por Row Level Security.

## Passo 1 — Criar o projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e entre com a mesma conta usada nos outros projetos (ou crie uma).
2. **New Project** → nome sugerido `menuflex`, senha de banco forte, região `South America`.
3. Aguarde provisionar (~2 min).

## Passo 2 — Rodar as migrations
No **SQL Editor** do projeto, rode nesta ordem (uma de cada vez, "Run"):
1. `supabase/migrations/0001_schema.sql` — cria todas as tabelas, funções (`is_business_admin`, `check_plan_feature`, `create_order`, etc.) e as políticas de RLS.
2. `supabase/migrations/0002_seed.sql` — popula os planos (`plan_features`) e o negócio de demonstração "Point do Zé" (`/loja/point-do-ze`).
3. `supabase/migrations/0003_item_options.sql` — grupos de opções por item (ex.: ponto da carne, adicionais), usados pelo `ItemOptionsModal` no front.
4. `supabase/migrations/0004_planos_pagos.sql` — papel de super-admin (`rhoneyinc@gmail.com`, gerência de toda a plataforma) e a tabela `plan_payments` (upgrade de plano via Mercado Pago).
5. `supabase/migrations/0005_perfil_negocio.sql` — campos de perfil do negócio (descrição, endereço, telefone, horário, logo) usados no menu "Minha Empresa", + policies de storage pro upload da logo.
6. `supabase/migrations/0006_indicacoes_parceiros.sql` — tabela `partner_referrals` do programa de indicação (`/parceiros`).

> Se preferir usar o Supabase CLI localmente (`supabase start` + `supabase db reset`), as duas migrations rodam automaticamente na ordem certa — o `0002_seed.sql` também funciona nesse modo porque a role local tem privilégio para inserir em `auth.users`.

## Passo 3 — Pegar suas chaves
1. **Project Settings → API**.
2. Copie a **Project URL** e a **anon public key**.
3. Em `app/`, copie `.env.example` para `.env.local` e cole:
   ```
   VITE_SUPABASE_URL=SUA_URL_AQUI
   VITE_SUPABASE_ANON_KEY=SUA_CHAVE_AQUI
   ```

⚠️ **Nunca** cole a `service_role key` no front-end — ela ignora todo o RLS. Só a `anon public key` é segura para rodar no navegador.

## Passo 4 — Confirmação de e-mail (donos de negócio)
Por padrão o Supabase exige confirmação de e-mail antes do dono do negócio conseguir logar no painel ADM.
- Para testar rápido: **Authentication → Providers → Email → desative "Confirm email"**.
- Para produção: deixe ativado e configure o template em **Authentication → Email Templates**.

## Passo 5 — Bucket de imagens do cardápio
**Storage → New bucket** → nome `menu-images`, marque como **público** (as fotos dos itens do cardápio aparecem na página pública `/loja/:slug`, então não precisam de RLS de leitura).

## Passo 6 — Rodar o front-end
```
cd app
npm install
npm run dev
```
Abra `http://localhost:5173/loja/point-do-ze` para ver o cardápio de demonstração.

## Passo 7 — Publicar
Hospedagem recomendada: **Vercel** (mesmo padrão do RhoneyInc/MeuPet). Configure as mesmas variáveis `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` em **Project Settings → Environment Variables** do Vercel.

---

## Como a segurança funciona

| Tabela | Quem lê | Quem escreve |
|---|---|---|
| `businesses`, `menu_categories`, `menu_items` | Todo mundo (cardápio público) | Só admin daquele negócio (`is_business_admin()`) |
| `orders`, `order_items` | Admin do negócio + o cliente dono do pedido | Cliente cria via `create_order()` (RPC), admin atualiza status |
| `plan_features` | Todo mundo (o front precisa saber o que está liberado) | Ninguém pela API — só via migration |
| `consent_logs`, `data_deletion_requests` | O próprio usuário que registrou | Qualquer um pode inserir o próprio registro |

O gate de plano (`check_plan_feature`) roda **dentro** de `create_order()`, no banco — mesmo que alguém manipule o front-end para tentar criar um pedido delivery num negócio Free, o Postgres rejeita.

Nunca cole a `service_role key` em nenhum arquivo do repositório.

## Gerência da plataforma e pagamentos de plano

- **Super-admin**: o e-mail `rhoneyinc@gmail.com` tem acesso a todos os negócios cadastrados (aba "Gerência RhoneyInc" no painel `/admin`, liberada só pra esse e-mail). Pra isso funcionar, crie a conta desse e-mail via **Authentication → Users** (ou deixe a pessoa se cadastrar normalmente pelo `/admin?cadastro=1`) — a policy `is_super_admin()` (0004) já reconhece o e-mail direto no JWT, sem precisar marcar nada a mais.
- **Upgrade de plano (Básico/Premium)**: pago via **Mercado Pago** (PIX, boleto ou cartão) — a conta Mercado Pago deve estar associada a `rhoneyinc@gmail.com`, com saque via PIX pra conta Nubank do mesmo e-mail. O valor da assinatura é da RhoneyInc (dona da plataforma), não do negócio individual.
- **Ainda falta** (fora do escopo do front): uma função serverless (Vercel ou Supabase Edge Function) que (1) cria a *preference* de pagamento no Mercado Pago com o access token secreto, (2) recebe o webhook de confirmação e marca `plan_payments.status = 'approved'` + atualiza `businesses.plan`. Até essa função existir e `VITE_CHECKOUT_API_URL` ser configurada, o botão de upgrade em Configurações mostra um aviso em vez de cobrar de verdade.
