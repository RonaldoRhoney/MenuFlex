export interface TutorialCardContent {
  icon: string
  title: string
  description: string
  videoUrl?: string
}

// Sem vídeos gravados ainda — cada card já reserva `videoUrl` pronto pra
// receber o link real no futuro (VideoPlayer mostra placeholder até lá).
export const PASSOS_LOJISTA: TutorialCardContent[] = [
  {
    icon: '👋',
    title: 'Bem-vindo ao MenuFlex',
    description: 'O sistema que digitaliza seu cardápio e automatiza seus pedidos.',
  },
  {
    icon: '🏪',
    title: 'Cadastre seu negócio',
    description: 'Nome, endereço, telefone, WhatsApp, horário de funcionamento, logo e capa — tudo em poucos minutos.',
  },
  {
    icon: '🍔',
    title: 'Monte seu cardápio',
    description: 'Categorias, produtos, fotos, preços, descrição, combos e adicionais — do seu jeito.',
  },
  {
    icon: '⚙️',
    title: 'Configure seu negócio',
    description: 'Retirada, entrega, Pix, cartão, taxa de entrega e horários de atendimento.',
  },
  {
    icon: '📤',
    title: 'Compartilhe seu cardápio',
    description: 'QR Code, link direto, WhatsApp, Instagram e Facebook — leve seus clientes até você.',
  },
  {
    icon: '🔔',
    title: 'Receba pedidos em tempo real',
    description: 'Cada novo pedido aparece instantaneamente no seu painel, com alerta sonoro.',
  },
  {
    icon: '📊',
    title: 'Acompanhe suas vendas',
    description: 'Painel completo, relatórios, produtos mais vendidos e histórico de clientes.',
  },
  {
    icon: '🎉',
    title: 'Pronto!',
    description: 'Seu negócio já pode vender usando o MenuFlex.',
  },
]

export const PASSOS_CLIENTE: TutorialCardContent[] = [
  {
    icon: '👋',
    title: 'Bem-vindo!',
    description: 'Descubra como fazer pedidos em poucos segundos.',
  },
  {
    icon: '📱',
    title: 'Escaneie o QR Code',
    description: 'Ou simplesmente clique no link do cardápio compartilhado pelo estabelecimento.',
  },
  {
    icon: '🍕',
    title: 'Escolha seus produtos',
    description: 'Navegue pelas categorias, veja fotos, monte combos e adicione complementos.',
  },
  {
    icon: '🛒',
    title: 'Monte seu pedido',
    description: 'Ajuste a quantidade e adicione observações pra deixar tudo do seu jeito.',
  },
  {
    icon: '🛵',
    title: 'Escolha entrega ou retirada',
    description: 'Você decide como quer receber seu pedido.',
  },
  {
    icon: '💳',
    title: 'Pague',
    description: 'Pix, cartão ou dinheiro — o que for mais prático pra você.',
  },
  {
    icon: '⏱️',
    title: 'Acompanhe seu pedido',
    description: 'Recebido, preparando, saiu para entrega, concluído — tudo em tempo real.',
  },
  {
    icon: '🍔',
    title: 'Bom apetite!',
    description: 'Seu pedido está a caminho. Aproveite!',
  },
]
