import type { CSSProperties } from 'react'

// 12 chaves de cor por negócio — todas opcionais. Ausência de qualquer chave
// cai no valor de DEFAULTS, que reproduz exatamente o visual hardcoded de
// hoje (Tailwind neutral-50/900/brand). Isso garante que um negócio sem
// personalização renderiza pixel-idêntico ao cardápio atual.
export interface ThemeConfig {
  primaria?: string
  secundaria?: string
  destaque?: string
  fundo?: string
  cards?: string
  botoes?: string
  textos?: string
  precos?: string
  icones?: string
  badges?: string
  avisos?: string
  botao_compra?: string
}

// Mesmos valores hex que os utilitários Tailwind hoje resolvem (neutral-50,
// neutral-900, brand/brand-dark de app/src/index.css) — nada muda pro
// negócio que nunca configurou tema.
export const DEFAULTS: Required<ThemeConfig> = {
  primaria: '#171717', // neutral-900 (banner/cabeçalho)
  secundaria: '#525252', // neutral-600
  destaque: '#f97316', // brand (mesmo default já usado em MinhaEmpresa.tsx)
  fundo: '#fafafa', // neutral-50
  cards: '#ffffff',
  botoes: '#f97316', // brand
  textos: '#171717', // neutral-900
  precos: '#ea580c', // brand-dark
  icones: '#a3a3a3', // neutral-400
  badges: '#f97316',
  avisos: '#ef4444', // red-500
  botao_compra: '#f97316',
}

const CSS_VAR_PREFIX = '--biz-'

// Prefixo próprio (--biz-*, nunca --color-brand) garante que essas variáveis
// nunca colidem com as do próprio MenuFlex — o admin do MenuFlex não lê
// nenhuma delas, então nenhum tema de negócio pode vazar pra lá.
export function themeToCssVars(theme: ThemeConfig | null | undefined): CSSProperties {
  const merged = { ...DEFAULTS, ...(theme ?? {}) }
  const vars: Record<string, string> = {}
  for (const [key, value] of Object.entries(merged)) {
    vars[`${CSS_VAR_PREFIX}${key.replace(/_/g, '-')}`] = value
  }
  return vars as CSSProperties
}
