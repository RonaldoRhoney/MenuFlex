# MenuFlex — Automações via n8n

Reaproveita a mesma instância n8n (Railway) e o mesmo bot do Telegram já
configurados para o MeuPet — ver `MeuPet/automations/SETUP.md` se precisar
recriar essa infraestrutura do zero. Aqui só os passos específicos do
MenuFlex.

## Escopo desta fase

Só a automação 1 (LGPD — exclusão de dados) está pronta. As automações de
**autenticação** e **moderação de conteúdo**, previstas no plano do MVP como
"fase futura", entram depois, uma de cada vez.

## 1. Importar o workflow

1. No n8n (mesma URL do Railway usada pelo MeuPet), clique em **"+"** →
   **"Import from File"** e selecione `automations/n8n/1_lgpd_exclusao_dados.json`.
2. Credencial do Telegram: selecione a já existente **"Telegram MeuPet Bot"**
   (mesmo bot — as notificações do MenuFlex chegam no mesmo chat que as do
   MeuPet, já que você optou por não separar por enquanto).
3. Credencial de SMTP: **ainda não existe**. O node de e-mail fica associado a
   uma credencial `SMTP MenuFlex` que você só cria quando tiver um provedor
   (Resend, SendGrid, Gmail SMTP, etc). Até lá, o node falha silenciosamente
   (`continueOnFail: true`) e o aviso ao admin via Telegram continua
   funcionando normalmente.

## 2. Find & replace manual (dentro do n8n, nunca no arquivo do repo)

No node **"Confirma secret"**, troque `SEU_WEBHOOK_SECRET_AQUI` por um valor
aleatório novo (`openssl rand -hex 24`) — **diferente** do `x-meupet-secret`
do MeuPet, mesmo compartilhando a instância.

No node **"Telegram - avisa admin"**, troque `SEU_TELEGRAM_CHAT_ID_AQUI` pelo
mesmo `CHAT_ID` já usado no MeuPet (ou outro, se preferir separar o aviso).

## 3. Ativar e pegar a URL do webhook

1. Ative o workflow (toggle "Active").
2. Clique no node **Webhook** e copie a **URL de produção**.
3. Anote em `automations/n8n_webhooks.md`.

## 4. Configurar o Database Webhook no Supabase

Supabase Dashboard (projeto MenuFlex) → **Database → Webhooks → Create a new
hook**:

- **Nome**: `lgpd-exclusao-dados`
- **Tabela**: `data_deletion_requests`
- **Evento**: INSERT
- **Tipo**: HTTP Request
- **URL**: a URL copiada no passo anterior
- **HTTP Method**: POST
- **HTTP Headers**: `Content-Type: application/json` e
  `x-menuflex-secret: <o mesmo valor colado no node "Confirma secret">`

## 5. Testar com dado real antes de confiar

1. Acesse `/admin/privacidade` no MenuFlex publicado e envie um pedido de
   exclusão de teste (ou insira uma linha via SQL).
2. Confirme que a mensagem chega no Telegram formatada corretamente.
3. Se algo vier errado, veja "Executions" no n8n — mostra o payload exato e
   onde falhou.

## Nota sobre a promessa da tela Privacidade

O texto atual (`src/pages/admin/Privacidade.tsx`) diz "Vamos processar e
confirmar por e-mail" — isso só se torna verdade de fato quando o SMTP for
configurado (passo 1 acima). Até lá, a confirmação real é o aviso que chega
pro admin via Telegram, que processa manualmente.
