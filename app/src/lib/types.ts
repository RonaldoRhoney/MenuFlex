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
}

export interface MenuCategory {
  id: string
  business_id: string
  name: string
  order_index: number
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
  menu_item_id: string
  name: string
  unit_price: number
  quantity: number
  notes: string
}
