// Database Models
export interface User {
  id: number
  name: string
  email: string
  password_hash?: string
  role: 'admin' | 'cashier'
  is_active: boolean
  created_at?: Date
}

export interface Customer {
  id: number
  name: string
  phone: string | null
  email: string | null
  created_at?: Date
}

export interface Product {
  id: number
  name: string
  price: number
  category: string
  stock: number
  image_url: string | null
  is_active: boolean
  created_at?: Date
}

export interface Sale {
  id: number
  customer_id: number | null
  user_id: number
  customer_name: string | null
  subtotal: number
  tax: number
  discount: number
  total: number
  payment_method: 'cash' | 'card' | 'transfer'
  cash_received: number | null
  change_amount: number | null
  created_at: Date
}

export interface SaleItem {
  id: number
  sale_id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  promotion_applied: string | null
}

export interface Promotion {
  id: string
  name: string
  type: '2x1' | 'percentage' | 'fixed'
  product_id: number | null
  discount_value: number
  min_quantity: number
  is_active: boolean
  created_at?: Date
}

// UI/Cart Types
export interface CartItem {
  product: Product
  quantity: number
  subtotal: number
  promotionApplied?: string
  originalPrice: number
  discountedPrice: number
}

export interface CartSummary {
  items: CartItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  promoApplied: boolean
  promoMessage?: string
}

// Auth Types
export interface AuthUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'cashier'
}

export interface AuthResponse {
  accessToken: string
  user: AuthUser
}

export interface LoginCredentials {
  emailOrUsername: string
  password: string
  rememberMe: boolean
}

// Report Types
export interface SalesByPaymentMethod {
  payment_method: string
  count: number
  total: number
}

export interface ProductSalesReport {
  product_id: number
  product_name: string
  quantity_sold: number
  total_revenue: number
}

export interface SalesByUser {
  user_id: number
  user_name: string
  sale_count: number
  total_sales: number
}

export interface DailySalesReport {
  date: string
  count: number
  total: number
}
