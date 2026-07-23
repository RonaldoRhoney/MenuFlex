# Assets para a ficha da Play Store

- `feature-graphic.png` — 1024×500, gráfico de destaque
- `01-cardapio-publico.png`, `02-admin-pedidos.png`, `03-admin-cardapio.png` — screenshots mobile (390×844)

## Textos prontos

**Descrição curta (80 car.):**
Cardápio digital e pedidos para o seu negócio de alimentação

**Descrição completa:**
MenuFlex é o cardápio digital e sistema de pedidos completo para lanchonetes, bares, restaurantes, hamburguerias e negócios de alimentação em geral.

Com o MenuFlex, seu negócio ganha:
- Cardápio digital com fotos, categorias e opções por item (ponto da carne, adicionais etc.)
- Recebimento de pedidos em tempo real, sem exigir cadastro do cliente
- Painel de gestão: perfil do negócio, horário de funcionamento, analytics de vendas
- Página pública do seu cardápio, pronta para compartilhar com clientes
- Upgrade de plano simples via Mercado Pago

Para o cliente final, pedir é rápido: acesse o cardápio, escolha os itens e envie o pedido — sem senha, sem cadastro.

MenuFlex é um produto RhoneyInc.

**Categoria:** Alimentação e bebida
**Contato:** rhoneyinc@gmail.com
**Política de Privacidade:** https://menuflex.rhoneyinc.com/privacidade

## App access (conta de teste pro revisor)

- URL: https://menuflex.rhoneyinc.com/admin
- E-mail: `revisor@demo.menuflex.app`
- Senha: ver histórico da conversa que criou essa conta (não versionada aqui por segurança) — negócio "Sabor da Esquina", criado só para revisão/screenshots, isolado dos dados reais.

## Data Safety

Coleta: nome, e-mail, telefone, localização aproximada (opcional, calculada no dispositivo), status de pagamento (via Mercado Pago, sem dados de cartão). Tudo em trânsito via HTTPS. Sem venda a terceiros, sem analytics de terceiros. Exclusão de dados disponível dentro do painel (`/admin` → aba Privacidade).

## App Android (TWA)

Gerado via Bubblewrap em `/home/rhoney/menuflex-android/`:
- `.aab`: `app-release-bundle.aab`
- `packageId`: `com.rhoneyinc.menuflex`
- Digital Asset Links: `app/public/.well-known/assetlinks.json` (já em produção)
