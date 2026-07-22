import Footer from '../components/Footer'

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="text-base font-semibold text-neutral-900 mb-2">{titulo}</h2>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 max-w-2xl mx-auto px-4 py-12 text-sm text-neutral-600 leading-relaxed">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Política de Privacidade</h1>
        <p className="text-xs text-neutral-400 mb-8">Última atualização: julho de 2026</p>

        <Secao titulo="1. Quem somos">
          <p>
            O MenuFlex é um produto da RhoneyInc, um cardápio digital e sistema de pedidos para negócios de
            alimentação (lanchonetes, bares, restaurantes, hamburguerias e similares). Esta política se aplica
            tanto ao dono do negócio que usa o painel administrativo quanto ao cliente final que acessa o
            cardápio para fazer um pedido.
          </p>
        </Secao>

        <Secao titulo="2. Dados que coletamos">
          <p>
            <strong>Do dono do negócio (cadastro no painel):</strong> e-mail e senha, ou dados básicos de perfil
            se o login for feito via Google ou Facebook (nome, e-mail, foto — conforme autorizado por você
            nesses provedores). Também os dados do próprio negócio: nome, endereço, telefone, horário de
            funcionamento, localização geográfica e itens do cardápio.
          </p>
          <p>
            <strong>Do cliente final (quem faz um pedido):</strong> nome e telefone informados na hora do
            pedido. Não exigimos cadastro nem senha para pedir.
          </p>
          <p>
            <strong>Localização por proximidade:</strong> com o seu consentimento explícito (perguntado antes
            de qualquer coleta), usamos a localização do seu navegador só para verificar se você está fisicamente
            perto de um negócio cadastrado, e sugerir a instalação do app. Essa coordenada não é enviada nem
            armazenada nos nossos servidores — o cálculo acontece no seu próprio dispositivo. Só registramos se
            você permitiu ou negou o uso (não a localização em si).
          </p>
          <p>
            <strong>Dados de acesso (analytics):</strong> registramos visitas de forma anônima — página
            acessada, tipo de dispositivo, navegador e localização aproximada (país/cidade, obtida pelo
            cabeçalho de rede, nunca pelo IP bruto armazenado). Não é possível identificar uma pessoa a partir
            desses dados.
          </p>
          <p>
            <strong>Pagamentos:</strong> quando um negócio faz upgrade de plano, o pagamento é processado
            diretamente pelo Mercado Pago. Não temos acesso a número de cartão ou dados bancários — só ao
            status do pagamento (pendente, aprovado ou rejeitado) e valor.
          </p>
        </Secao>

        <Secao titulo="3. Para que usamos esses dados">
          <ul className="list-disc pl-5 space-y-1">
            <li>Operar o cardápio digital e a fila de pedidos de cada negócio;</li>
            <li>Processar upgrades de plano e liberar as funcionalidades correspondentes;</li>
            <li>Sugerir a instalação do app a clientes fisicamente próximos de um negócio (com consentimento);</li>
            <li>Entender o uso agregado da plataforma para melhorar o produto (analytics anônimo);</li>
            <li>Cumprir obrigações legais e responder a solicitações de titulares de dados (LGPD).</li>
          </ul>
        </Secao>

        <Secao titulo="4. Com quem compartilhamos">
          <p>Não vendemos dados. Compartilhamos o mínimo necessário com prestadores que operam a plataforma:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase</strong> — banco de dados, autenticação e armazenamento de arquivos (logos);</li>
            <li><strong>Vercel</strong> — hospedagem da aplicação e das funções de servidor;</li>
            <li><strong>Mercado Pago</strong> — processamento de pagamentos de upgrade de plano;</li>
            <li><strong>Google / Facebook</strong> — apenas se você optar por entrar com essas contas (login social).</li>
          </ul>
          <p>
            O MenuFlex não usa nenhuma inteligência artificial de terceiros que processe dados pessoais de
            donos de negócio ou clientes — o autocomplete de itens do cardápio é um dicionário colaborativo
            simples, sem envio de dados a nenhuma API externa de IA.
          </p>
        </Secao>

        <Secao titulo="5. Seus direitos (LGPD)">
          <p>
            Você pode solicitar a exclusão dos seus dados a qualquer momento pelo painel do negócio (aba
            Privacidade) ou pelo formulário público de exclusão. Também pode pedir acesso, correção ou
            portabilidade dos seus dados entrando em contato pelo e-mail abaixo. Respondemos dentro de um
            prazo razoável, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).
          </p>
        </Secao>

        <Secao titulo="6. Retenção de dados">
          <p>
            Mantemos os dados enquanto a conta ou o negócio estiver ativo, ou pelo tempo necessário para
            cumprir obrigação legal (ex.: registros fiscais de pagamento). Após uma solicitação de exclusão,
            os dados pessoais são removidos em até 30 dias, exceto o que a lei exigir manter.
          </p>
        </Secao>

        <Secao titulo="7. Crianças e adolescentes">
          <p>
            O MenuFlex não é direcionado a menores de 18 anos para fins de cadastro de negócio. Clientes finais
            de qualquer idade podem visualizar o cardápio público, mas não coletamos dado pessoal de menores
            além do que é fornecido voluntariamente por um responsável no momento de um pedido.
          </p>
        </Secao>

        <Secao titulo="8. Alterações nesta política">
          <p>
            Podemos atualizar esta política conforme o produto evolui. Mudanças relevantes serão comunicadas
            nesta página, com a data de atualização revisada no topo.
          </p>
        </Secao>

        <Secao titulo="9. Contato">
          <p>
            Dúvidas sobre privacidade ou solicitações relacionadas aos seus dados: <a className="text-brand-dark underline" href="mailto:rhoneyinc@gmail.com">rhoneyinc@gmail.com</a>.
          </p>
        </Secao>
      </div>
      <Footer />
    </div>
  )
}
