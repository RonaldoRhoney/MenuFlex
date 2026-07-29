import type { ReactNode } from 'react'
import {
  IlustracaoBoasVindas,
  IlustracaoCadastro,
  IlustracaoCardapio,
  IlustracaoCarrinho,
  IlustracaoCelebracao,
  IlustracaoCompartilhar,
  IlustracaoConfiguracoes,
  IlustracaoDashboard,
  IlustracaoEntregaRetirada,
  IlustracaoEscanear,
  IlustracaoPagamento,
  IlustracaoPedidoChegando,
  IlustracaoProdutos,
  IlustracaoStatusPedido,
} from '../components/landing/illustrations'

export interface TutorialCardContent {
  illustration: ReactNode
  title: string
  description: string
  videoUrl?: string
}

// Sem vídeos gravados ainda — cada card já reserva `videoUrl` pronto pra
// receber o link real no futuro (VideoPlayer mostra placeholder até lá).
// Ilustrações são mini-mockups em CSS/HTML (components/landing/illustrations.tsx),
// não fotos — mesmo espírito do card "Burger do Zé" que já existia no site.
export const PASSOS_LOJISTA: TutorialCardContent[] = [
  {
    illustration: <IlustracaoBoasVindas />,
    title: 'Bem-vindo ao MenuFlex',
    description: 'O sistema que digitaliza seu cardápio e automatiza seus pedidos.',
  },
  {
    illustration: <IlustracaoCadastro />,
    title: 'Cadastre seu negócio',
    description: 'Nome, endereço, telefone, WhatsApp, horário de funcionamento, logo e capa — tudo em poucos minutos.',
  },
  {
    illustration: <IlustracaoCardapio />,
    title: 'Monte seu cardápio',
    description: 'Categorias, produtos, fotos, preços, descrição, combos e adicionais — do seu jeito.',
  },
  {
    illustration: <IlustracaoConfiguracoes />,
    title: 'Configure seu negócio',
    description: 'Retirada, entrega, Pix, cartão, taxa de entrega e horários de atendimento.',
  },
  {
    illustration: <IlustracaoCompartilhar />,
    title: 'Compartilhe seu cardápio',
    description: 'QR Code, link direto, WhatsApp, Instagram e Facebook — leve seus clientes até você.',
  },
  {
    illustration: <IlustracaoPedidoChegando />,
    title: 'Receba pedidos em tempo real',
    description: 'Cada novo pedido aparece instantaneamente no seu painel, com alerta sonoro.',
  },
  {
    illustration: <IlustracaoDashboard />,
    title: 'Acompanhe suas vendas',
    description: 'Painel completo, relatórios, produtos mais vendidos e histórico de clientes.',
  },
  {
    illustration: <IlustracaoCelebracao emoji="🎉" />,
    title: 'Pronto!',
    description: 'Seu negócio já pode vender usando o MenuFlex.',
  },
]

export const PASSOS_CLIENTE: TutorialCardContent[] = [
  {
    illustration: <IlustracaoBoasVindas />,
    title: 'Bem-vindo!',
    description: 'Descubra como fazer pedidos em poucos segundos.',
  },
  {
    illustration: <IlustracaoEscanear />,
    title: 'Escaneie o QR Code',
    description: 'Ou simplesmente clique no link do cardápio compartilhado pelo estabelecimento.',
  },
  {
    illustration: <IlustracaoProdutos />,
    title: 'Escolha seus produtos',
    description: 'Navegue pelas categorias, veja fotos, monte combos e adicione complementos.',
  },
  {
    illustration: <IlustracaoCarrinho />,
    title: 'Monte seu pedido',
    description: 'Ajuste a quantidade e adicione observações pra deixar tudo do seu jeito.',
  },
  {
    illustration: <IlustracaoEntregaRetirada />,
    title: 'Escolha entrega ou retirada',
    description: 'Você decide como quer receber seu pedido.',
  },
  {
    illustration: <IlustracaoPagamento />,
    title: 'Pague',
    description: 'Pix, cartão ou dinheiro — o que for mais prático pra você.',
  },
  {
    illustration: <IlustracaoStatusPedido />,
    title: 'Acompanhe seu pedido',
    description: 'Recebido, preparando, saiu para entrega, concluído — tudo em tempo real.',
  },
  {
    illustration: <IlustracaoCelebracao emoji="🍔" />,
    title: 'Bom apetite!',
    description: 'Seu pedido está a caminho. Aproveite!',
  },
]
