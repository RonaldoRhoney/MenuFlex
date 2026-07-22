export type BusinessType = 'lanche_rua' | 'bar' | 'restaurante' | 'hamburgueria' | 'outro'
export type Plan = 'free' | 'basico' | 'premium'
export type OrderType = 'retirada' | 'delivery' | 'local'
export type OrderStatus = 'recebido' | 'preparo' | 'pronto' | 'entregue' | 'cancelado'

export interface Business {
  id: string
  owner_id: string
  name: string
  slug: string
  type: BusinessType
  plan: Plan
  theme_config: Record<string, string>
  lat: number | null
  lng: number | null
  is_open: boolean
  created_at: string
  description: string | null
  address: string | null
  neighborhood: string | null
  phone: string | null
  opening_hours: string | null
  logo_url: string | null
  usa_horario_programado: boolean
}

export interface BusinessHour {
  business_id: string
  day_of_week: number
  opens_at: string | null
  closes_at: string | null
  closed: boolean
}

export interface MenuCategory {
  id: string
  business_id: string
  name: string
  order_index: number
}

export interface Segment {
  id: string
  name: string
  slug: string
  icon: string | null
  order_index: number
  active: boolean
}

export interface MenuItemCatalogEntry {
  id: string
  name: string
  description: string | null
  suggested_price: number | null
  category_hint: string | null
  image_url: string | null
  segment_id: string | null
  usage_count: number
}

export interface MenuItemOptionChoice {
  id: string
  name: string
  price_delta: number
}

export interface MenuItemOptionGroup {
  id: string
  name: string
  required: boolean
  multiple: boolean
  choices: MenuItemOptionChoice[]
}

export interface MenuItem {
  id: string
  business_id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  order_index: number
  option_groups?: MenuItemOptionGroup[]
  origem_catalogo_id?: string | null
  veio_do_catalogo?: boolean
}

export type ReferralStatus = 'novo' | 'contatado' | 'convertido' | 'descartado'

export interface PartnerReferral {
  id: string
  referrer_name: string
  referrer_phone: string
  business_name: string
  business_phone: string
  business_city: string | null
  status: ReferralStatus
  created_at: string
}

export type PlanPaymentStatus = 'pending' | 'approved' | 'rejected'

export interface PlanPayment {
  id: string
  business_id: string
  plan: Plan
  amount: number
  mp_preference_id: string | null
  mp_payment_id: string | null
  status: PlanPaymentStatus
  created_at: string
  approved_at: string | null
}

export interface PlanFeatureRow {
  plan: Plan
  feature_key: string
  enabled: boolean
  usage_limit: number | null
}

export interface Order {
  id: string
  business_id: string
  customer_id: string | null
  order_type: OrderType
  status: OrderStatus
  total: number
  delivery_address: string | null
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string | null
  quantity: number
  unit_price: number
  notes: string | null
}

export interface CartItem {
  line_id: string
  menu_item_id: string
  name: string
  unit_price: number
  quantity: number
  notes: string
  options_summary?: string
}
