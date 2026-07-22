import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Loja from './pages/cliente/Loja'
import Painel from './pages/admin/Painel'
import Parceiros from './pages/Parceiros'
import PoliticaPrivacidade from './pages/PoliticaPrivacidade'
import TermosUso from './pages/TermosUso'
import Footer from './components/Footer'
import { useSession } from './lib/auth'

const PLANOS = [
  {
    nome: 'Free',
    preco: '0',
    itens: [
      'Cardápio digital com marca MenuFlex',
      'Pedido de retirada (limite mensal)',
      'Instalação por proximidade 100m',
      'Painel ADM básico',
    ],
    destaque: false,
  },
  {
    nome: 'Básico',
    preco: '19,90',
    itens: [
      'Tudo do Free',
      'Delivery + pedido no local',
      'Logo própria',
      'Proximidade 300m · Analytics',
    ],
    destaque: true,
  },
  {
    nome: 'Premium',
    preco: '39,90',
    itens: [
      'Tudo do Básico',
      'Identidade visual completa',
      'Proximidade 500m · Push',
      'Analytics avançado · Multi-unidades',
    ],
    destaque: false,
  },
]

function Home() {
  const { session } = useSession()

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 bg-slate-950 text-white">
        <nav className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center font-bold">M</span>
            <span className="font-semibold">MenuFlex</span>
          </div>
          <div className="flex items-center gap-5">
            {session ? (
              <Link
                to="/admin"
                className="rounded-full bg-brand text-white text-sm font-medium px-4 py-2 hover:bg-brand-dark"
              >
                Ir para o painel
              </Link>
            ) : (
              <>
                <Link to="/admin" className="text-sm text-white/80 hover:text-white">
                  Entrar
                </Link>
                <Link
                  to="/admin?cadastro=1"
                  className="rounded-full bg-brand text-white text-sm font-medium px-4 py-2 hover:bg-brand-dark"
                >
                  Criar meu negócio
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 pt-10 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block font-mono text-xs uppercase tracking-wider bg-brand/15 text-brand px-3 py-1 rounded-full mb-5">
              MVP · Fase 1
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-5">
              Cardápio digital que <span className="text-brand">funciona no bolso do cliente.</span>
            </h1>
            <p className="text-white/60 max-w-md mb-8">
              Lanche de rua, bar, restaurante ou hamburgueria — um único app, seus cardápios, seus
              pedidos em tempo real. Instalável no celular do cliente por proximidade.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/admin?cadastro=1"
                className="rounded-lg bg-brand text-white px-5 py-2.5 font-medium hover:bg-brand-dark"
              >
                Começar de graça
              </Link>
              <a
                href="#planos"
                className="rounded-lg border border-white/20 text-white px-5 py-2.5 font-medium hover:bg-white/5"
              >
                Ver planos
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 shadow-xl p-4">
            <p className="font-mono text-xs text-white/40 mb-3">/loja/burger-do-ze</p>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">Burger do Zé</span>
              <span className="text-xs font-medium bg-brand/15 text-brand px-2.5 py-1 rounded-full">
                Aberto
              </span>
            </div>
            <div className="divide-y divide-white/10">
              {[
                ['Cheddar Duplo', 'R$ 28,90'],
                ['Batata Cheddar Bacon', 'R$ 22,00'],
                ['Milk Shake Ovomaltine', 'R$ 18,00'],
              ].map(([nome, preco]) => (
                <div key={nome} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-white/80">{nome}</span>
                  <span className="text-white/60">{preco}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div id="planos" className="max-w-6xl mx-auto px-4 pb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Um código, três planos.</h2>
            <p className="text-white/50 text-sm">O que muda é o que fica liberado.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {PLANOS.map((plano) => (
              <div
                key={plano.nome}
                className={`rounded-xl p-6 bg-slate-900 border ${
                  plano.destaque ? 'border-brand' : 'border-white/10'
                }`}
              >
                <p className="font-mono text-xs uppercase tracking-wider text-brand mb-3">{plano.nome}</p>
                <p className="mb-4">
                  <span className="text-2xl font-bold">R$ {plano.preco}</span>
                  <span className="text-white/40 text-sm">/mês</span>
                </p>
                <ul className="space-y-2">
                  {plano.itens.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-white/70">
                      <span className="text-brand shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

function PaginaEstatica({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold mb-4">{titulo}</h1>
        <div className="text-sm text-neutral-600 leading-relaxed space-y-3">{children}</div>
      </div>
      <Footer />
    </div>
  )
}

// Registro de acesso anônimo (sem cookies, sem IP guardado) — best-effort,
// nunca bloqueia nem afeta a navegação se a chamada falhar. Dispara a cada
// troca de rota da SPA (não só no load inicial).
function PageTracker() {
  const location = useLocation()
  useEffect(() => {
    try {
      const payload = JSON.stringify({ path: location.pathname })
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }))
      } else {
        fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {})
      }
    } catch {
      // analytics é best-effort — nunca deve quebrar a navegação
    }
  }, [location.pathname])
  return null
}

function App() {
  return (
    <BrowserRouter>
      <PageTracker />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/loja/:slug" element={<Loja />} />
        <Route path="/admin" element={<Painel />} />
        <Route path="/parceiros" element={<Parceiros />} />
        <Route path="/privacidade" element={<PoliticaPrivacidade />} />
        <Route path="/termos" element={<TermosUso />} />
        <Route
          path="/contato"
          element={<PaginaEstatica titulo="Contato"><p>contato@rhoneyinc.com</p></PaginaEstatica>}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
