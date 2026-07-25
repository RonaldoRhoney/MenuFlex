# Prompt para Claude Code — Segurança como Prioridade (MenuFlex)

Este documento não substitui os outros três prompts já criados (design, estoque, autenticação/painel admin) — ele é uma **camada obrigatória de segurança** que deve ser aplicada em cima de qualquer implementação feita a partir deles. Antes de codar qualquer parte, apresente o plano de segurança correspondente e só implemente depois da minha aprovação.

## Contexto

O MenuFlex agora vai lidar com dados sensíveis e fluxos críticos: autenticação de clientes e administradores via Google, identificação nominal de clientes em pedidos, controle de estoque, e planos pagos. Segurança deixa de ser um detalhe e passa a ser **prioridade de primeira classe** em toda decisão técnica — não um ajuste feito depois que a feature já está pronta.

## Diretriz geral

Atue como um agente de segurança revisando cada implementação antes, durante e depois de codar. Isso significa, no mínimo:

1. **Autenticação e sessão**
   - Validar que toda rota administrativa (Estoque, Pedidos, Configurações, painel desktop) exige sessão autenticada válida — nunca confiar em estado do front-end para decidir quem é admin.
   - Tokens de sessão do Supabase Auth devem expirar e renovar corretamente; sem tokens de longa duração desnecessários.
   - Login via Google deve seguir o fluxo OAuth padrão do Supabase, sem lógica customizada que reimplemente verificação de identidade.

2. **Autorização (RLS) em todas as tabelas novas e alteradas**
   - Toda tabela nova (estoque, clientes, pedidos com nome associado) precisa de política RLS explícita — nunca liberar `select`/`update`/`insert` amplo por padrão.
   - Isolamento multitenant reforçado: um administrador nunca pode ler/alterar dados de outro negócio, mesmo manipulando requisições diretamente (testar isso, não só confiar na UI).
   - Cliente final nunca pode ler dados de estoque, dados de outros clientes, ou pedidos que não sejam dele — validado no banco, não só escondido na tela.
   - Regra de plano (Estoque exclusivo do Básico+) deve ser validada no backend/RLS, não apenas ocultada visualmente.

3. **Validação de dados de entrada**
   - Toda entrada do usuário (nome no pré-cadastro, quantidade de estoque, itens de pedido, valores) deve ser validada e sanitizada no backend, não só no front-end — nunca confiar em validação de formulário como única barreira.
   - Proteger contra valores inválidos ou maliciosos (ex: estoque negativo, preço negativo, injeção via campos de texto livre como "Descrição" ou "Detalhes").

4. **Dados pessoais e LGPD**
   - Nome do cliente é dado pessoal — tratar com o mesmo rigor já previsto na tela de Privacidade existente (coleta mínima, finalidade clara, opção de exclusão).
   - Nenhum dado pessoal deve aparecer em logs, mensagens de erro expostas ao usuário, ou respostas de API além do necessário.

5. **Concorrência e integridade**
   - Operações críticas (débito de estoque por pedido, mudança de status de pedido) devem ser transacionais no Supabase, evitando condições de corrida que gerem estoque negativo ou pedidos duplicados.

6. **Segurança de infraestrutura**
   - Variáveis sensíveis (chaves Supabase, credenciais Google OAuth) nunca expostas no bundle do front-end além do estritamente necessário (usar apenas chaves públicas/anon no cliente, nunca service role).
   - Rate limiting básico em endpoints sensíveis (login, criação de pedido) para mitigar abuso automatizado.
   - HTTPS obrigatório em todas as rotas (já padrão via Vercel, mas confirmar que nenhum recurso externo é carregado por HTTP).

7. **Superfície de ataque do app Android (TWA)**
   - Confirmar que o `assetlinks.json` e a configuração de domínio continuam corretos a cada mudança de rota/autenticação, para não abrir brecha de spoofing de domínio.

## Entregável esperado do plano de segurança

Antes de implementar qualquer uma das features dos outros três prompts, apresente:

1. Lista de todas as tabelas novas/alteradas com a política RLS proposta para cada uma (quem pode ler, escrever, e sob qual condição).
2. Pontos onde validação de backend é necessária além da validação de front-end já planejada.
3. Riscos específicos identificados em cada feature (estoque, autenticação, painel admin) e como cada um será mitigado.
4. Qualquer trade-off entre segurança e experiência do usuário que exija minha decisão (ex: fricção extra de login vs. proteção adicional).
