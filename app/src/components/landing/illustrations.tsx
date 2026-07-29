// Mini-mockups do tutorial da landing page — reproduzem telas reais do
// MenuFlex em CSS/HTML (mesmo espírito do card "Burger do Zé" que existia
// no Hero antigo), sem depender de imagem externa. Reutilizados entre os
// fluxos Lojista/Cliente onde o conceito se repete (QR Code, status do
// pedido etc.), com pequenas animações (pulse/fade) pra não ficar estático.

import type { ReactNode } from 'react'

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[280px] rounded-2xl border border-white/10 bg-slate-900 shadow-lg overflow-hidden">
      {children}
    </div>
  )
}

export function IlustracaoBoasVindas() {
  return (
    <Frame>
      <div className="relative flex flex-col items-center justify-center gap-3 py-10">
        <span className="absolute w-20 h-20 rounded-full bg-brand/20 animate-ping" />
        <span className="relative w-16 h-16 rounded-2xl bg-brand flex items-center justify-center text-3xl shadow-lg shadow-brand/40">
          🍽️
        </span>
        <span className="font-display font-bold text-lg">
          Menu<span className="text-brand">Flex</span>
        </span>
      </div>
    </Frame>
  )
}

export function IlustracaoCadastro() {
  const campos = ['Nome do negócio', 'Endereço', 'WhatsApp', 'Horário de funcionamento']
  return (
    <Frame>
      <div className="p-4 space-y-2.5">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-9 h-9 rounded-lg bg-slate-950 border border-dashed border-white/20 flex items-center justify-center text-sm shrink-0">
            🖼️
          </span>
          <span className="text-xs text-white/40">Logo do negócio</span>
        </div>
        {campos.map((campo, i) => (
          <div
            key={campo}
            className="h-8 rounded-lg bg-slate-950 border border-white/10 px-2.5 flex items-center text-xs text-white/50 animate-fade-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {campo}
          </div>
        ))}
      </div>
    </Frame>
  )
}

export function IlustracaoCardapio() {
  const categorias = ['Lanches', 'Pizzas', 'Bebidas']
  const itens = [
    ['🍔', 'Combo Burger', 'R$ 34,90'],
    ['🍕', 'Pizza Calabresa', 'R$ 29,90'],
  ]
  return (
    <Frame>
      <div className="p-3.5 space-y-3">
        <div className="flex gap-1.5">
          {categorias.map((c, i) => (
            <span
              key={c}
              className={`text-[10px] px-2 py-1 rounded-full ${i === 0 ? 'bg-brand text-white' : 'bg-white/5 text-white/50'}`}
            >
              {c}
            </span>
          ))}
        </div>
        <div className="space-y-2">
          {itens.map(([emoji, nome, preco], i) => (
            <div
              key={nome}
              className="flex items-center gap-2.5 bg-slate-950 rounded-xl p-2 border border-white/5 animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <span className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-lg shrink-0">{emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{nome}</p>
                <p className="text-[11px] text-brand">{preco}</p>
              </div>
              <span className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-sm shrink-0">+</span>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  )
}

export function IlustracaoConfiguracoes() {
  const opcoes: [string, string][] = [
    ['🛵', 'Entrega'],
    ['🥡', 'Retirada'],
    ['💠', 'Pix'],
    ['💳', 'Cartão'],
  ]
  return (
    <Frame>
      <div className="grid grid-cols-2 gap-2.5 p-4">
        {opcoes.map(([emoji, label], i) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center gap-1.5 bg-slate-950 border border-white/10 rounded-xl py-4 animate-fade-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="text-xl">{emoji}</span>
            <span className="text-[11px] text-white/60">{label}</span>
          </div>
        ))}
      </div>
    </Frame>
  )
}

export function QrCodeGraphic({ size = 84 }: { size?: number }) {
  // Grade pseudoaleatória fixa (mesma seed sempre) só pra parecer um QR Code de verdade.
  const grade = [
    1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0,
    1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1,
    1, 1, 1, 0, 1, 0, 1, 1, 1,
  ]
  return (
    <div style={{ width: size, height: size }} className="grid grid-cols-9 gap-[1px] bg-white p-1.5 rounded-lg shrink-0">
      {grade.map((on, i) => (
        <span key={i} className={on ? 'bg-slate-950' : 'bg-white'} />
      ))}
    </div>
  )
}

export function IlustracaoCompartilhar() {
  const canais = ['📲', '💬', '📸', '👍']
  return (
    <Frame>
      <div className="p-4 flex items-center gap-3">
        <QrCodeGraphic />
        <div className="flex-1 space-y-2">
          <p className="text-[11px] text-white/40">Compartilhe em:</p>
          <div className="flex gap-1.5">
            {canais.map((c, i) => (
              <span
                key={c}
                className="w-8 h-8 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center text-sm animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  )
}

export function IlustracaoEscanear() {
  return (
    <Frame>
      <div className="relative p-6 flex items-center justify-center">
        <QrCodeGraphic size={120} />
        <span className="absolute left-6 right-6 h-0.5 bg-brand shadow-[0_0_8px_2px] shadow-brand/60 animate-[scan_1.8s_ease-in-out_infinite]" />
        <style>{`@keyframes scan { 0%,100% { top: 1.5rem } 50% { top: calc(100% - 1.5rem) } }`}</style>
      </div>
    </Frame>
  )
}

export function IlustracaoPedidoChegando() {
  return (
    <Frame>
      <div className="p-4">
        <div className="flex items-center gap-2.5 bg-slate-950 rounded-xl p-3 border border-brand/30 animate-fade-in">
          <span className="relative w-9 h-9 rounded-full bg-brand/20 flex items-center justify-center text-lg shrink-0">
            🔔
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand text-white text-[10px] flex items-center justify-center animate-pulse">
              1
            </span>
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium">Novo pedido!</p>
            <p className="text-[11px] text-white/40">Recebido agora mesmo</p>
          </div>
        </div>
      </div>
    </Frame>
  )
}

export function IlustracaoDashboard() {
  const barras = [40, 70, 55, 90, 65, 100, 75]
  return (
    <Frame>
      <div className="p-4">
        <div className="flex items-end gap-1.5 h-20 mb-3">
          {barras.map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-t bg-brand/70 animate-fade-in"
              style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[11px] text-white/40">
          <span>Pedidos</span>
          <span className="text-brand font-medium">+32% essa semana</span>
        </div>
      </div>
    </Frame>
  )
}

export function IlustracaoCelebracao({ emoji = '🎉' }: { emoji?: string }) {
  return (
    <Frame>
      <div className="flex flex-col items-center justify-center gap-2 py-10">
        <span className="text-5xl animate-pop-in">{emoji}</span>
        <span className="text-sm text-white/50">Tudo pronto</span>
      </div>
    </Frame>
  )
}

export function IlustracaoProdutos() {
  const grade = [
    ['🍔', 'R$ 28,90'],
    ['🍟', 'R$ 12,00'],
    ['🥤', 'R$ 6,90'],
    ['🍰', 'R$ 14,00'],
  ]
  return (
    <Frame>
      <div className="grid grid-cols-2 gap-2 p-3.5">
        {grade.map(([emoji, preco], i) => (
          <div
            key={preco}
            className="bg-slate-950 rounded-xl p-2.5 border border-white/5 text-center animate-fade-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="text-xl block mb-1">{emoji}</span>
            <span className="text-[11px] text-brand">{preco}</span>
          </div>
        ))}
      </div>
    </Frame>
  )
}

export function IlustracaoCarrinho() {
  const itens: [string, number][] = [
    ['Combo Burger', 1],
    ['Suco Natural', 2],
  ]
  return (
    <Frame>
      <div className="p-4 space-y-2">
        {itens.map(([nome, qtd], i) => (
          <div
            key={nome}
            className="flex items-center justify-between bg-slate-950 rounded-lg px-3 py-2 border border-white/5 text-xs animate-fade-in"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span>{nome}</span>
            <span className="flex items-center gap-2 text-white/50">
              <span className="w-5 h-5 rounded-full border border-white/15 flex items-center justify-center">−</span>
              {qtd}
              <span className="w-5 h-5 rounded-full border border-white/15 flex items-center justify-center">+</span>
            </span>
          </div>
        ))}
        <input
          disabled
          placeholder="Observações (ex: sem cebola)"
          className="w-full text-[11px] bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 placeholder:text-white/25"
        />
      </div>
    </Frame>
  )
}

export function IlustracaoEntregaRetirada() {
  return (
    <Frame>
      <div className="grid grid-cols-2 gap-2.5 p-4">
        {[
          ['🛵', 'Entrega'],
          ['🥡', 'Retirada'],
        ].map(([emoji, label], i) => (
          <div
            key={label}
            className={`flex flex-col items-center gap-1.5 rounded-xl py-5 border animate-fade-in ${
              i === 0 ? 'bg-brand/10 border-brand/40' : 'bg-slate-950 border-white/10'
            }`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <span className="text-2xl">{emoji}</span>
            <span className="text-xs">{label}</span>
          </div>
        ))}
      </div>
    </Frame>
  )
}

export function IlustracaoPagamento() {
  const metodos: [string, string][] = [
    ['💠', 'Pix'],
    ['💳', 'Cartão'],
    ['💵', 'Dinheiro'],
  ]
  return (
    <Frame>
      <div className="flex gap-2.5 p-4">
        {metodos.map(([emoji, label], i) => (
          <div
            key={label}
            className="flex-1 flex flex-col items-center gap-1.5 bg-slate-950 border border-white/10 rounded-xl py-4 animate-fade-in"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span className="text-xl">{emoji}</span>
            <span className="text-[10px] text-white/60">{label}</span>
          </div>
        ))}
      </div>
    </Frame>
  )
}

export function IlustracaoStatusPedido() {
  const passos = ['Recebido', 'Preparando', 'A caminho', 'Concluído']
  return (
    <Frame>
      <div className="p-5">
        <div className="relative mb-3">
          <div className="absolute top-3 left-3 right-3 h-0.5 bg-white/10" />
          <div className="absolute top-3 left-3 h-0.5 bg-brand w-2/3 transition-all" />
          <div className="relative flex justify-between">
            {passos.map((p, i) => (
              <div key={p} className="flex flex-col items-center gap-1.5">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                    i <= 2 ? 'bg-brand text-white' : 'bg-white/10 text-white/40'
                  }`}
                >
                  {i < 2 ? '✓' : i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-xs text-white/50">Saiu para entrega</p>
      </div>
    </Frame>
  )
}
