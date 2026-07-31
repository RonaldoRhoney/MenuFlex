// Biblioteca estática de sugestões de insumo por segmento — só acelera o
// cadastro (autocomplete + botão "Adicionar" + pré-preenchimento de
// categoria/unidade/estoque mínimo). Nunca é obrigatória, nunca sobrescreve
// o que o lojista já cadastrou. Puramente frontend, sem tabela nova —
// reaproveita os slugs já seedados em public.segments (0011_segmentos_multiplos.sql).
export interface InsumoSugestao {
  nome: string
  unidade: string
  categoria: string
  estoque_minimo: number
}

export const SUGESTOES_POR_SEGMENTO: Record<string, InsumoSugestao[]> = {
  acai: [
    { nome: 'Polpa de Açaí', unidade: 'kg', categoria: 'Base', estoque_minimo: 5 },
    { nome: 'Granola', unidade: 'kg', categoria: 'Complemento', estoque_minimo: 1 },
    { nome: 'Banana', unidade: 'un', categoria: 'Fruta', estoque_minimo: 10 },
    { nome: 'Morango', unidade: 'kg', categoria: 'Fruta', estoque_minimo: 1 },
    { nome: 'Leite Condensado', unidade: 'un', categoria: 'Complemento', estoque_minimo: 3 },
    { nome: 'Leite em Pó', unidade: 'kg', categoria: 'Complemento', estoque_minimo: 1 },
    { nome: 'Nutella', unidade: 'kg', categoria: 'Complemento', estoque_minimo: 1 },
    { nome: 'Copo 300 ml', unidade: 'un', categoria: 'Embalagem', estoque_minimo: 50 },
    { nome: 'Copo 500 ml', unidade: 'un', categoria: 'Embalagem', estoque_minimo: 50 },
    { nome: 'Tampa', unidade: 'un', categoria: 'Embalagem', estoque_minimo: 100 },
    { nome: 'Colher', unidade: 'un', categoria: 'Embalagem', estoque_minimo: 100 },
    { nome: 'Guardanapo', unidade: 'un', categoria: 'Embalagem', estoque_minimo: 100 },
    { nome: 'Sacola', unidade: 'un', categoria: 'Embalagem', estoque_minimo: 50 },
    { nome: 'Canudo', unidade: 'un', categoria: 'Embalagem', estoque_minimo: 100 },
  ],
  hamburgueria: [
    { nome: 'Pão de Hambúrguer', unidade: 'un', categoria: 'Base', estoque_minimo: 20 },
    { nome: 'Carne de Hambúrguer', unidade: 'un', categoria: 'Proteína', estoque_minimo: 20 },
    { nome: 'Queijo Cheddar', unidade: 'kg', categoria: 'Complemento', estoque_minimo: 2 },
    { nome: 'Alface', unidade: 'un', categoria: 'Hortifruti', estoque_minimo: 5 },
    { nome: 'Tomate', unidade: 'kg', categoria: 'Hortifruti', estoque_minimo: 3 },
    { nome: 'Bacon', unidade: 'kg', categoria: 'Proteína', estoque_minimo: 2 },
    { nome: 'Molho Especial', unidade: 'l', categoria: 'Molho', estoque_minimo: 1 },
    { nome: 'Batata Palito', unidade: 'kg', categoria: 'Acompanhamento', estoque_minimo: 5 },
    { nome: 'Embalagem Delivery', unidade: 'un', categoria: 'Embalagem', estoque_minimo: 50 },
    { nome: 'Guardanapo', unidade: 'un', categoria: 'Embalagem', estoque_minimo: 100 },
  ],
  pizzaria: [
    { nome: 'Massa de Pizza', unidade: 'un', categoria: 'Base', estoque_minimo: 10 },
    { nome: 'Molho de Tomate', unidade: 'l', categoria: 'Molho', estoque_minimo: 3 },
    { nome: 'Queijo Mussarela', unidade: 'kg', categoria: 'Complemento', estoque_minimo: 5 },
    { nome: 'Presunto', unidade: 'kg', categoria: 'Complemento', estoque_minimo: 2 },
    { nome: 'Calabresa', unidade: 'kg', categoria: 'Complemento', estoque_minimo: 2 },
    { nome: 'Orégano', unidade: 'kg', categoria: 'Tempero', estoque_minimo: 0.5 },
    { nome: 'Caixa de Pizza', unidade: 'un', categoria: 'Embalagem', estoque_minimo: 30 },
  ],
  padaria: [
    { nome: 'Farinha de Trigo', unidade: 'kg', categoria: 'Base', estoque_minimo: 10 },
    { nome: 'Fermento', unidade: 'kg', categoria: 'Base', estoque_minimo: 2 },
    { nome: 'Açúcar', unidade: 'kg', categoria: 'Base', estoque_minimo: 5 },
    { nome: 'Manteiga', unidade: 'kg', categoria: 'Base', estoque_minimo: 3 },
    { nome: 'Ovos', unidade: 'un', categoria: 'Base', estoque_minimo: 30 },
    { nome: 'Leite', unidade: 'l', categoria: 'Base', estoque_minimo: 10 },
    { nome: 'Saco de Pão', unidade: 'un', categoria: 'Embalagem', estoque_minimo: 50 },
  ],
  restaurante: [
    { nome: 'Arroz', unidade: 'kg', categoria: 'Base', estoque_minimo: 10 },
    { nome: 'Feijão', unidade: 'kg', categoria: 'Base', estoque_minimo: 5 },
    { nome: 'Óleo de Soja', unidade: 'l', categoria: 'Base', estoque_minimo: 5 },
    { nome: 'Sal', unidade: 'kg', categoria: 'Tempero', estoque_minimo: 2 },
    { nome: 'Carne Bovina', unidade: 'kg', categoria: 'Proteína', estoque_minimo: 10 },
    { nome: 'Frango', unidade: 'kg', categoria: 'Proteína', estoque_minimo: 10 },
    { nome: 'Marmitex', unidade: 'un', categoria: 'Embalagem', estoque_minimo: 50 },
  ],
  lanchonete: [
    { nome: 'Pão de Forma', unidade: 'un', categoria: 'Base', estoque_minimo: 5 },
    { nome: 'Presunto', unidade: 'kg', categoria: 'Complemento', estoque_minimo: 2 },
    { nome: 'Queijo Mussarela', unidade: 'kg', categoria: 'Complemento', estoque_minimo: 2 },
    { nome: 'Refrigerante Lata', unidade: 'un', categoria: 'Bebida', estoque_minimo: 24 },
    { nome: 'Guardanapo', unidade: 'un', categoria: 'Embalagem', estoque_minimo: 100 },
    { nome: 'Embalagem Delivery', unidade: 'un', categoria: 'Embalagem', estoque_minimo: 50 },
  ],
  bar: [
    { nome: 'Cerveja Long Neck', unidade: 'un', categoria: 'Bebida', estoque_minimo: 48 },
    { nome: 'Gelo', unidade: 'kg', categoria: 'Insumo', estoque_minimo: 10 },
    { nome: 'Limão', unidade: 'kg', categoria: 'Fruta', estoque_minimo: 3 },
    { nome: 'Copo Descartável', unidade: 'un', categoria: 'Embalagem', estoque_minimo: 100 },
    { nome: 'Guardanapo', unidade: 'un', categoria: 'Embalagem', estoque_minimo: 100 },
  ],
  outro: [
    { nome: 'Guardanapo', unidade: 'un', categoria: 'Embalagem', estoque_minimo: 100 },
    { nome: 'Embalagem Delivery', unidade: 'un', categoria: 'Embalagem', estoque_minimo: 50 },
    { nome: 'Sacola', unidade: 'un', categoria: 'Embalagem', estoque_minimo: 50 },
  ],
}

// Lista achatada (todos os segmentos, sem duplicar nome) — usada pro
// autocomplete geral quando ainda não sabemos ou não achamos sugestão
// específica do segmento do negócio.
export const TODAS_SUGESTOES: InsumoSugestao[] = Object.values(SUGESTOES_POR_SEGMENTO)
  .flat()
  .filter((s, i, arr) => arr.findIndex((x) => x.nome.toLowerCase() === s.nome.toLowerCase()) === i)
