import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Loja from './pages/cliente/Loja'
import Painel from './pages/admin/Painel'
import Footer from './components/Footer'

function Home() {
  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16">
        <h1 className="text-3xl font-semibold mb-3">MenuFlex</h1>
        <p className="text-neutral-600 max-w-md mb-6">
          Cardápio digital e fila de pedidos para negócios de alimentação — sem comissão por pedido.
        </p>
        <Link to="/loja/point-do-ze" className="rounded-lg bg-brand text-white px-5 py-2.5 font-medium">
          Ver cardápio de demonstração
        </Link>
        <Link to="/admin" className="mt-4 text-sm text-brand-dark">
          Já tenho um negócio cadastrado →
        </Link>
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/loja/:slug" element={<Loja />} />
        <Route path="/admin" element={<Painel />} />
        <Route
          path="/privacidade"
          element={
            <PaginaEstatica titulo="Política de Privacidade">
              <p>
                O MenuFlex coleta apenas os dados necessários para operar o cardápio e os
                pedidos de cada negócio cadastrado: nome e telefone informados na hora do
                pedido, e, mediante consentimento explícito, sua localização — usada só para
                sugerir a instalação do app quando você está fisicamente perto de um negócio.
              </p>
              <p>
                Você pode solicitar a exclusão dos seus dados a qualquer momento pelo painel
                do negócio (aba Privacidade) ou entrando em contato.
              </p>
            </PaginaEstatica>
          }
        />
        <Route
          path="/termos"
          element={<PaginaEstatica titulo="Termos de uso"><p>MVP em fase de validação — termos completos em breve.</p></PaginaEstatica>}
        />
        <Route
          path="/contato"
          element={<PaginaEstatica titulo="Contato"><p>contato@rhoneyinc.com</p></PaginaEstatica>}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
