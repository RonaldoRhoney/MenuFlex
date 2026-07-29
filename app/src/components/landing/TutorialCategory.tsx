interface TutorialCategoryProps {
  onEscolher: (categoria: 'lojista' | 'cliente') => void
}

// Tela inicial do tutorial da landing page: separa os dois fluxos
// independentes (lojista vende, cliente compra) antes de mostrar os cards.
export default function TutorialCategory({ onEscolher }: TutorialCategoryProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-10 text-center">
      <p className="text-2xl font-bold mb-1">Como você quer usar o MenuFlex?</p>
      <p className="text-white/50 text-sm mb-8">Escolha um caminho pra ver como funciona.</p>
      <div className="grid sm:grid-cols-2 gap-4 w-full max-w-md">
        <button
          onClick={() => onEscolher('lojista')}
          className="rounded-2xl border border-white/10 bg-slate-900 hover:border-brand/60 hover:bg-brand/5 transition-colors p-6 text-left"
        >
          <span className="text-4xl block mb-3">👨‍🍳</span>
          <span className="font-semibold block mb-1">Sou Lojista</span>
          <span className="text-sm text-white/50">Quero vender pelo MenuFlex</span>
        </button>
        <button
          onClick={() => onEscolher('cliente')}
          className="rounded-2xl border border-white/10 bg-slate-900 hover:border-brand/60 hover:bg-brand/5 transition-colors p-6 text-left"
        >
          <span className="text-4xl block mb-3">🛒</span>
          <span className="font-semibold block mb-1">Sou Cliente</span>
          <span className="text-sm text-white/50">Quero fazer um pedido</span>
        </button>
      </div>
    </div>
  )
}
