import { Link, useLocation } from 'react-router-dom'

// Esqueleto fixo do rodapé RhoneyInc (.claude/skills/footer-padrao) — estrutura,
// ordem de colunas e textos do ecossistema são iguais em todo produto RhoneyInc.
// Só cor de acento, logo e links de "Produto" mudam por produto.
//
// Ícones sociais removidos de propósito: a RhoneyInc ainda não tem perfis
// sociais reais, e um ícone linkando pra "#" é pior que não ter o ícone.
// Volta a existir assim que houver Instagram/TikTok/WhatsApp/YouTube de verdade.
export default function Footer() {
  const ano = new Date().getFullYear()
  const { pathname } = useLocation()
  // Âncoras (#planos) só existem na Home — noutras páginas o link precisa
  // voltar pra "/" antes do #, senão fica um href morto (bug real reportado).
  const home = pathname === '/' ? '' : '/'

  return (
    <footer className="relative overflow-hidden bg-neutral-900 text-neutral-100/90 px-4 pt-16 pb-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[-10%] w-[420px] h-[420px] rounded-full bg-brand/10 blur-3xl"
      />
      <div className="relative mx-auto max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-8 pb-9 border-b border-white/10">
          <div>
            <Link to="/" className="flex items-center gap-2 text-xl font-semibold text-white">
              <span className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-base shrink-0">🍔</span>
              MenuFlex
            </Link>
            <p className="text-sm text-white/60 mt-3 mb-4 max-w-[260px] leading-relaxed">
              Cardápio digital e fila de pedidos para negócios de alimentação — feito pela RhoneyInc.
            </p>
            <span className="font-mono text-xs tracking-wide bg-brand/15 text-brand inline-block px-3 py-1.5 rounded-lg">
              Uma conta. Todos os softwares.
            </span>
          </div>

          <div>
            <h5 className="font-mono text-xs uppercase tracking-wider text-brand mb-3.5">Produto</h5>
            <a href={`${home}#planos`} className="block text-sm text-white/75 hover:text-white mb-2.5 transition-colors">Planos</a>
            <Link to="/loja/point-do-ze" className="block text-sm text-white/75 hover:text-white mb-2.5 transition-colors">Ver cardápio de exemplo</Link>
            <Link to="/parceiros" className="block text-sm text-white/75 hover:text-white mb-2.5 transition-colors">Parceiros</Link>
            <Link to="/admin" className="block text-sm text-white/75 hover:text-white mb-2.5 transition-colors">Painel ADM</Link>
          </div>

          <div>
            <h5 className="font-mono text-xs uppercase tracking-wider text-brand mb-3.5">RhoneyInc</h5>
            <a href="https://meupet-zeta.vercel.app" target="_blank" rel="noopener" className="block text-sm text-white/75 hover:text-white mb-2.5 transition-colors">MeuPet</a>
            <a href="https://finwise.rhoneyinc.com" target="_blank" rel="noopener" className="block text-sm text-white/75 hover:text-white mb-2.5 transition-colors">FinWise</a>
            <a href="https://fitnow.rhoneyinc.com" target="_blank" rel="noopener" className="block text-sm text-white/75 hover:text-white mb-2.5 transition-colors">FitNow</a>
            <a href="#" className="block text-sm text-white/75 hover:text-white mb-2.5 transition-colors">MontaMóvel</a>
            <a href="#" className="block text-sm text-white/75 hover:text-white mb-2.5 transition-colors">AmaVida</a>
            <a href="#" className="block text-sm text-white/75 hover:text-white mb-2.5 transition-colors">Até Passar</a>
            <a href="https://rhoneyinc.com" target="_blank" rel="noopener" className="block text-sm text-white/75 hover:text-white mb-2.5 transition-colors">Sobre nós</a>
          </div>

          <div>
            <h5 className="font-mono text-xs uppercase tracking-wider text-brand mb-3.5">Legal</h5>
            <Link to="/privacidade" className="block text-sm text-white/75 hover:text-white mb-2.5 transition-colors">Privacidade (LGPD)</Link>
            <Link to="/termos" className="block text-sm text-white/75 hover:text-white mb-2.5 transition-colors">Termos de uso</Link>
            <Link to="/contato" className="block text-sm text-white/75 hover:text-white mb-2.5 transition-colors">Contato</Link>
          </div>
        </div>

        <div className="flex justify-between items-center flex-wrap gap-3 pt-5 text-xs text-white/55">
          <span>© {ano} MenuFlex — um produto RhoneyInc. Todos os direitos reservados.</span>
          <span className="font-mono">rhoneyinc.com/menuflex</span>
        </div>
      </div>
    </footer>
  )
}
