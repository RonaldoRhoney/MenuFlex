// Esqueleto fixo do rodapé RhoneyInc (.claude/skills/footer-padrao) — estrutura,
// ordem de colunas e textos do ecossistema são iguais em todo produto RhoneyInc.
// Só cor de acento, logo e links de "Produto" mudam por produto.
export default function Footer() {
  const ano = new Date().getFullYear()

  return (
    <footer className="mt-10 bg-neutral-900 text-neutral-100/90 px-4 pt-14 pb-7">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-8 pb-9 border-b border-white/10">
          <div>
            <a href="#top" className="text-lg font-semibold text-white">
              <span className="mr-1">🍔</span>MenuFlex
            </a>
            <p className="text-sm text-white/60 mt-3 mb-4 max-w-[260px] leading-relaxed">
              Cardápio digital e fila de pedidos para negócios de alimentação — feito pela RhoneyInc.
            </p>
            <span className="font-mono text-xs tracking-wide bg-brand/15 text-brand inline-block px-3 py-1.5 rounded-lg">
              Uma conta. Todos os softwares.
            </span>
          </div>

          <div>
            <h5 className="font-mono text-xs uppercase tracking-wider text-brand mb-3.5">Produto</h5>
            <a href="#cardapio" className="block text-sm text-white/75 hover:text-white mb-2.5">Cardápio</a>
            <a href="#planos" className="block text-sm text-white/75 hover:text-white mb-2.5">Planos</a>
            <a href="/parceiros" className="block text-sm text-white/75 hover:text-white mb-2.5">Parceiros</a>
            <a href="/admin" className="block text-sm text-white/75 hover:text-white mb-2.5">Painel ADM</a>
          </div>

          <div>
            <h5 className="font-mono text-xs uppercase tracking-wider text-brand mb-3.5">RhoneyInc</h5>
            <a href="https://rhoneyinc.com" className="block text-sm text-white/75 hover:text-white mb-2.5">MeuPet</a>
            <a href="https://rhoneyinc.com" className="block text-sm text-white/75 hover:text-white mb-2.5">FinWise</a>
            <a href="https://rhoneyinc.com" className="block text-sm text-white/75 hover:text-white mb-2.5">Sobre nós</a>
          </div>

          <div>
            <h5 className="font-mono text-xs uppercase tracking-wider text-brand mb-3.5">Legal</h5>
            <a href="/privacidade" className="block text-sm text-white/75 hover:text-white mb-2.5">Privacidade (LGPD)</a>
            <a href="/termos" className="block text-sm text-white/75 hover:text-white mb-2.5">Termos de uso</a>
            <a href="/contato" className="block text-sm text-white/75 hover:text-white mb-2.5">Contato</a>
          </div>
        </div>

        <div className="flex justify-between items-center flex-wrap gap-3 pt-5 text-xs text-white/55">
          <span>© {ano} MenuFlex — um produto RhoneyInc. Todos os direitos reservados. Copyright @RhoneyInc</span>
          <span className="font-mono">rhoneyinc.com/menuflex</span>
        </div>
      </div>
    </footer>
  )
}
