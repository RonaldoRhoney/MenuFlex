import Footer from '../components/Footer'

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="text-base font-semibold text-neutral-900 mb-2">{titulo}</h2>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}

export default function TermosUso() {
  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 max-w-2xl mx-auto px-4 py-12 text-sm text-neutral-600 leading-relaxed">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Termos de Uso</h1>
        <p className="text-xs text-neutral-400 mb-8">Última atualização: julho de 2026</p>

        <Secao titulo="1. O que é o MenuFlex">
          <p>
            O MenuFlex é uma plataforma da RhoneyInc que fornece cardápio digital e fila de pedidos para
            negócios de alimentação. A RhoneyInc é a operadora da plataforma — não é dona nem responsável pela
            operação de nenhum negócio cadastrado, pela qualidade dos produtos vendidos, nem pela entrega ou
            retirada dos pedidos.
          </p>
        </Secao>

        <Secao titulo="2. Cadastro do negócio">
          <p>
            Para usar o painel administrativo, o dono do negócio deve ser maior de 18 anos e fornecer
            informações verdadeiras sobre o próprio negócio (nome, endereço, cardápio, preços). O dono é o
            único responsável por manter o cardápio atualizado, incluindo preços, disponibilidade e descrição
            correta dos itens.
          </p>
        </Secao>

        <Secao titulo="3. Planos e pagamento">
          <p>
            O MenuFlex oferece um plano gratuito e planos pagos (Básico e Premium), com funcionalidades
            adicionais descritas na página de planos. Pagamentos de upgrade são processados via Mercado Pago
            (PIX, boleto ou cartão); o valor é repassado à RhoneyInc, responsável pela plataforma. Preços podem
            mudar mediante aviso prévio na própria plataforma. Não fazemos reembolso de períodos já utilizados,
            salvo obrigação legal.
          </p>
        </Secao>

        <Secao titulo="4. Pedidos feitos por clientes finais">
          <p>
            O cliente final usa o cardápio público para montar e enviar um pedido de retirada, entrega ou
            consumo no local, conforme o que o negócio oferece. O MenuFlex é só o meio de comunicação do
            pedido — o pagamento (quando existir) e a execução (preparo, entrega) são combinados diretamente
            entre cliente e negócio, fora da plataforma.
          </p>
        </Secao>

        <Secao titulo="5. Responsabilidades do dono do negócio">
          <ul className="list-disc pl-5 space-y-1">
            <li>Garantir que preços e disponibilidade exibidos no cardápio estão corretos;</li>
            <li>Cumprir a legislação aplicável ao próprio negócio (sanitária, fiscal, consumidor);</li>
            <li>Não usar a plataforma para atividade ilegal ou para vender produtos proibidos;</li>
            <li>Responder pela relação de consumo com o cliente final (o CDC se aplica entre negócio e cliente, não entre RhoneyInc e cliente).</li>
          </ul>
        </Secao>

        <Secao titulo="6. Limitação de responsabilidade">
          <p>
            A RhoneyInc não garante disponibilidade ininterrupta da plataforma e não se responsabiliza por
            perdas decorrentes de indisponibilidade temporária, erro de cadastro feito pelo próprio negócio, ou
            disputas entre negócio e cliente final quanto à qualidade do produto ou da entrega.
          </p>
        </Secao>

        <Secao titulo="7. Propriedade intelectual">
          <p>
            A marca MenuFlex, o layout da plataforma e o código-fonte pertencem à RhoneyInc. O conteúdo do
            cardápio (nomes de produtos, descrições, fotos enviadas) pertence ao respectivo negócio cadastrado.
          </p>
        </Secao>

        <Secao titulo="8. Encerramento de conta">
          <p>
            O dono do negócio pode solicitar o encerramento da conta e exclusão dos dados a qualquer momento
            (ver Política de Privacidade). A RhoneyInc pode suspender ou encerrar uma conta que viole estes
            termos, mediante aviso quando possível.
          </p>
        </Secao>

        <Secao titulo="9. Alterações nestes termos">
          <p>
            Podemos atualizar estes termos conforme o produto evolui. Mudanças relevantes serão comunicadas
            nesta página, com a data de atualização revisada no topo.
          </p>
        </Secao>

        <Secao titulo="10. Lei aplicável">
          <p>
            Estes termos são regidos pela legislação brasileira. Dúvidas ou contato:{' '}
            <a className="text-brand-dark underline" href="mailto:rhoneyinc@gmail.com">rhoneyinc@gmail.com</a>.
          </p>
        </Secao>
      </div>
      <Footer />
    </div>
  )
}
