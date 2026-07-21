import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { signOut } from '../../lib/auth'

export interface AbaItem<T extends string> {
  value: T
  label: string
  icon: ReactNode
  badge?: number
}

interface AdminShellProps<T extends string> {
  title: string
  subtitle?: string
  abas: AbaItem<T>[]
  aba: T
  onSelectAba: (aba: T) => void
  children: ReactNode
}

// Casca compartilhada do painel admin: barra lateral fixa no desktop, abas
// horizontais no mobile — mesma identidade visual escura + laranja da
// landing page, que antes só existia nas páginas públicas.
export default function AdminShell<T extends string>({
  title,
  subtitle,
  abas,
  aba,
  onSelectAba,
  children,
}: AdminShellProps<T>) {
  const navLinkClass = (ativo: boolean) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      ativo ? 'bg-brand text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
    }`

  return (
    <div className="min-h-full flex flex-col sm:flex-row bg-slate-950 text-white">
      {/* Sidebar — desktop */}
      <aside className="hidden sm:flex w-60 shrink-0 flex-col border-r border-white/10">
        <div className="px-5 py-5 border-b border-white/10">
          <Link to="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mb-4" title="Abrir site em nova aba">
            <span className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center font-bold text-sm shrink-0">M</span>
            <span className="font-semibold text-sm">MenuFlex</span>
          </Link>
          <p className="font-semibold truncate">{title}</p>
          {subtitle && <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {abas.map((a) => (
            <button key={a.value} onClick={() => onSelectAba(a.value)} className={`w-full ${navLinkClass(aba === a.value)}`}>
              {a.icon}
              {a.label}
              {!!a.badge && (
                <span className="ml-auto inline-flex items-center justify-center text-[11px] bg-white/15 rounded-full w-5 h-5">
                  {a.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <Link to="/parceiros" target="_blank" rel="noopener noreferrer" className={navLinkClass(false)}>
            <IconHeart />
            Parceiros
          </Link>
          <button onClick={signOut} className={`w-full ${navLinkClass(false)}`}>
            <IconExit />
            Sair
          </button>
        </div>
      </aside>

      {/* Header + abas — mobile */}
      <header className="sm:hidden border-b border-white/10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">{title}</p>
            {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
          </div>
          <button onClick={signOut} className="text-xs text-white/60">
            Sair
          </button>
        </div>
        <nav className="flex gap-1 px-3 pb-2 overflow-x-auto">
          {abas.map((a) => (
            <button
              key={a.value}
              onClick={() => onSelectAba(a.value)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                aba === a.value ? 'bg-brand text-white' : 'text-white/60'
              }`}
            >
              {a.label}
              {!!a.badge && (
                <span className="inline-flex items-center justify-center text-[10px] bg-white/20 rounded-full w-4 h-4">
                  {a.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
    </div>
  )
}

// Ícones minimalistas em SVG (traço único, sem dependência externa).
export function IconPedidos() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 9h8M8 13h5" />
    </svg>
  )
}
export function IconEmpresa() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M3 9.5 12 3l9 6.5" />
      <path d="M5 9v11h14V9" />
      <path d="M9 20v-6h6v6" />
    </svg>
  )
}
export function IconCardapio() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M6 3v18M6 3c-1.5 0-2 1-2 2.5S4.5 8 6 8M6 3c1.5 0 2 1 2 2.5S7.5 8 6 8" />
      <path d="M18 3v7c0 1-1 2-2 2s-2-1-2-2V3M16 3v18M18 12v9" />
    </svg>
  )
}
export function IconConfig() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  )
}
export function IconAnalytics() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M3 3v18h18" />
      <rect x="7" y="12" width="3" height="6" />
      <rect x="12.5" y="8" width="3" height="10" />
      <rect x="18" y="5" width="3" height="13" />
    </svg>
  )
}
export function IconPrivacidade() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z" />
    </svg>
  )
}
export function IconGerencia() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="m2 20 2-9 4 3 4-8 4 8 4-3 2 9Z" />
    </svg>
  )
}
function IconHeart() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  )
}
function IconExit() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}
