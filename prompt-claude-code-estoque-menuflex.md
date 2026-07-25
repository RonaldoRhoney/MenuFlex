# Prompt para Claude Code — Módulo de Estoque (Mapa de Calor) no MenuFlex

Antes de escrever qualquer código, trace e me apresente um plano das mudanças propostas (schema, componentes, fluxo). Só depois de eu aprovar o plano, implemente.

## Contexto

O MenuFlex é um PWA multitenant de cardápio digital (React + Supabase), com abas de navegação: Minha Empresa, Cardápio, Pedidos, Analytics, Configurações, Privacidade. Quero adicionar uma nova aba: **Estoque**.

## Observação importante — controle exclusivo do administrador

O controle de estoque é **exclusivo do dono do negócio (administrador)**, dentro do painel administrativo do MenuFlex. O cliente final (quem faz o pedido no cardápio público) **não tem acesso a nenhuma tela, dado ou controle de estoque** — para ele, o único reflexo do estoque deve ser indireto: um item aparecer como "Indisponível" no cardápio quando zerado. Nenhuma quantidade, cor, alerta ou tela de estoque pode vazar para a experiência do cliente/consumidor final. Isso deve ficar explícito na implementação (rotas, permissões RLS, e componentes visuais).

## Integração automática Pedidos ↔ Estoque

O estoque não pode ser um módulo isolado — ele precisa se alimentar automaticamente do fluxo de pedidos, e vice-versa:

- **Pedido feito → estoque baixa automaticamente**: quando um pedido é criado (ou muda para um status que confirme a saída do produto — a definir no plano se é na criação ou ao entrar em "Em preparo"), a quantidade de cada item pedido deve ser **debitada automaticamente** de `estoque_atual`, sem ação manual do administrador.
- **Cancelamento de pedido → estoque devolve**: se um pedido for cancelado antes de ser preparado/entregue, o estoque debitado deve ser **estornado automaticamente** (somado de volta).
- **Mudança de cor em tempo real**: ao debitar o estoque, o item deve recalcular sua cor (verde/amarelo/vermelho) na hora, refletindo no mapa de calor sem precisar de reload manual.
- **Zerou o estoque durante um pedido em andamento**: se o débito automático levar `estoque_atual` a 0, disparar a mesma regra já prevista (marcar item como indisponível / sugerir ao admin).
- **Concorrência**: definir no plano como tratar dois pedidos simultâneos do mesmo item quando o estoque está baixo (ex: last-write-wins vs. transação atômica no Supabase que impede estoque negativo) — evitar que o estoque fique negativo.
- **Reposição manual**: o administrador continua podendo ajustar `estoque_atual` manualmente a qualquer momento (entrada de mercadoria, correção, contagem física) — essa ação é independente do fluxo de pedidos.

## Objetivo

Criar um módulo de gestão de estoque com visualização por **mapa de calor**, para o lojista identificar rapidamente a situação de cada produto:

- 🟢 **Verde** — estoque OK (quantidade acima do limite de alerta)
- 🟡 **Amarelo** — alerta (quantidade baixa, próxima de faltar)
- 🔴 **Vermelho** — faltando (quantidade zerada ou esgotado)

## Escopo funcional

1. **Nova aba "Estoque"** no menu de navegação, seguindo o padrão visual das abas existentes.

2. **Modelo de dados (Supabase)**
   - Cada item do cardápio precisa de campos de controle de estoque:
     - `estoque_atual` (quantidade atual, numérico)
     - `estoque_minimo` (limite para virar alerta amarelo)
     - `estoque_habilitado` (boolean — nem todo lojista quer controlar estoque, deve ser opcional por item ou por negócio)
   - Regra de cor:
     - `estoque_atual = 0` → vermelho
     - `estoque_atual <= estoque_minimo` (e > 0) → amarelo
     - `estoque_atual > estoque_minimo` → verde
   - Avaliar se isso entra como colunas novas na tabela de itens do cardápio existente ou em uma tabela separada `estoque_itens` relacionada por `item_id` — decidir e justificar no plano.

3. **Tela de Estoque (mapa de calor)**
   - Grid ou lista dos itens do cardápio, cada um com um cartão/indicador colorido (verde/amarelo/vermelho) conforme a regra acima.
   - Mostrar nome do item, quantidade atual e categoria.
   - Permitir edição rápida da quantidade direto na tela (ex: botões +/- ou campo editável), sem precisar ir em outra tela.
   - Filtro rápido por status (ex: "ver só o que está faltando").
   - Ordenação sugerida: itens vermelhos primeiro, depois amarelos, depois verdes — para o lojista ver o que precisa de atenção assim que abre a tela.

4. **Alertas**
   - Quando um item entra em vermelho (esgotado), sugerir automaticamente marcar o item como "Indisponível" no cardápio (ou perguntar ao lojista se quer fazer isso), para não continuar recebendo pedidos de algo que acabou.
   - Avaliar um badge/contador na aba "Estoque" (ex: "3" em vermelho) mostrando quantos itens estão em alerta/faltando, visível mesmo sem entrar na aba.

5. **Configuração por lojista**
   - Definir onde o lojista configura o `estoque_minimo` de cada item (pode ser na própria tela de Estoque, ou em Cardápio ao criar/editar o item).

## Regra de plano — Estoque é exclusivo do Básico em diante

Decisão fechada: o módulo de Estoque **não fica disponível no plano Free**. Ele é liberado a partir do **plano Básico** (e continua disponível no Premium), no mesmo grupo de diferenciais pagos junto com **logo própria / personalização de identidade visual**, que já é exclusiva do Básico hoje.

- No **Free**, a aba "Estoque" continua visível no menu (não deve sumir/quebrar a navegação), mas ao tocar nela o lojista vê uma tela de **bloqueio/upsell**, não o módulo em si.
- Essa tela de bloqueio deve deixar claro, de forma direta e sem letra miúda, que **a partir do plano Básico** ele libera: controle de estoque com mapa de calor **e** a personalização/edição de identidade visual (logo própria), reforçando os dois como parte do mesmo pacote de upgrade — não apenas o estoque isolado.
- Incluir um botão de ação clara (ex: "Fazer upgrade para Básico"), consistente com o botão já usado na tela de Configurações/Planos.
- Mesmo raciocínio de UX que hoje já existe no bloco "Logo do negócio" em Minha Empresa ("Disponível a partir do plano Básico — faça upgrade em Configurações"): usar um texto e um componente de aviso equivalente, para manter consistência visual e de tom entre os dois bloqueios.
- No backend/RLS: garantir que o gate de plano seja validado no servidor (não só escondido na UI) — um lojista Free não pode debitar/consultar estoque via chamada direta à API/Supabase, mesmo manipulando o front-end.

## Requisitos não funcionais

- Seguir o padrão visual e de componentes já usado no restante do app (cores, espaçamento, tipografia definida no ajuste de design anterior).
- Responsivo, priorizando mobile (uso majoritário via TWA/Android).
- Rodapé "Copyright @RhoneyInc" mantido.
- Sem quebrar a estrutura RLS existente no Supabase — todo acesso a estoque deve respeitar o isolamento multitenant (cada lojista só vê/edita seu próprio estoque).
- RLS deve garantir que **somente o administrador autenticado do negócio** tenha SELECT/UPDATE nas colunas/tabela de estoque. O cliente final (rota pública do cardápio) não deve ter nenhuma permissão de leitura sobre `estoque_atual`, `estoque_minimo` ou status de cor — só deve enxergar o campo derivado de disponibilidade (disponível/indisponível) já existente no cardápio.

## Entregável esperado do plano (antes de codar)

1. Decisão sobre modelagem de dados (colunas na tabela existente vs. tabela nova) com justificativa.
2. Decisão sobre o mecanismo de débito/estorno automático de estoque a partir de pedidos (trigger no Supabase, function transacional, ou lógica no backend/n8n) e como evitar estoque negativo em concorrência.
3. Wireframe textual da tela de Estoque (o que aparece, nessa ordem, com qual comportamento de toque/clique).
4. Regra de negócio final da automação de "marcar indisponível quando zerar".
5. Como será implementada a tela/estado de bloqueio do Estoque para o plano Free (componente, texto, validação de plano no backend).
6. Lista de arquivos/componentes novos e existentes que serão alterados.
