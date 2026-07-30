// Formatação compartilhada de moeda/data — antes duplicada (byte a byte) em
// vários arquivos, cada cópia com o mesmo bug: `toFixed(2).replace('.', ',')`
// não usa separador de milhar (ex. "R$ 12345,00" em vez de "R$ 12.345,00").
export function formatarReais(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatarData(iso: string | null | undefined): string {
  if (!iso) return 'Nunca'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
