# MenuFlex — URLs dos webhooks n8n (preencher após ativar cada workflow)

Veja `SETUP.md` para o passo a passo. Preencha as URLs reais aqui conforme for
ativando cada workflow no n8n, e use essas mesmas URLs ao configurar os
Database Webhooks no Supabase.

| # | Automação                    | Tabela / Evento              | URL do webhook n8n |
|---|-------------------------------|-------------------------------|---------------------|
| 1 | LGPD — pedido de exclusão     | `data_deletion_requests` INSERT | _(preencher)_     |

**Nunca coloque a service_role key ou o token do Telegram neste arquivo** —
só URLs de webhook (que não são segredo, servem só pra receber POST).
