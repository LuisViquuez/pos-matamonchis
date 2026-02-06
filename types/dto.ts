import { z } from 'zod'

// Auth DTOs
export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
})

export type LoginDTO = z.infer<typeof loginSchema>

// Product DTOs
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(150),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required').max(100),
  stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  image_url: z.string().url().nullable().optional(),
  is_active: z.boolean().default(true),
})

export type CreateProductDTO = z.infer<typeof createProductSchema>

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.number(),
})

export type UpdateProductDTO = z.infer<typeof updateProductSchema>

// User DTOs
export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  email: z.string().email('Invalid email').max(150),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'cashier']),
  is_active: z.boolean().default(true),
})

export type CreateUserDTO = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required').max(120).optional(),
  email: z.string().email('Invalid email').max(150).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['admin', 'cashier']).optional(),
  is_active: z.boolean().optional(),
})

export type UpdateUserDTO = z.infer<typeof updateUserSchema>

// Sale DTOs
export const saleItemSchema = z.object({
  product_id: z.number(),
  product_name: z.string(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  subtotal: z.number(),
  promotion_applied: z.string().nullable().optional(),
})

export const createSaleSchema = z.object({
  customer_id: z.number().nullable().optional(),
  customer_name: z.string().max(150).nullable().optional(),
  subtotal: z.number(),
  tax: z.number(),
  discount: z.number(),
  total: z.number(),
  payment_method: z.enum(['cash', 'card', 'transfer']),
  cash_received: z.number().nullable().optional(),
  change_amount: z.number().nullable().optional(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
})

export type CreateSaleDTO = z.infer<typeof createSaleSchema>
export type SaleItemDTO = z.infer<typeof saleItemSchema>

// Payment DTOs
export const cashPaymentSchema = z.object({
  method: z.literal('cash'),
  cashReceived: z.number().positive('Amount must be positive'),
})

export const cardPaymentSchema = z.object({
  method: z.literal('card'),
  cardNumber: z.string().regex(/^\d{16}$/, 'Card number must be 16 digits'),
  cardHolder: z.string().min(1, 'Card holder name is required'),
  expiration: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Invalid expiration format (MM/YY)'),
  cvv: z.string().regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
})

export type CashPaymentDTO = z.infer<typeof cashPaymentSchema>
export type CardPaymentDTO = z.infer<typeof cardPaymentSchema>

// Report Filter DTOs
export const reportFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export type ReportFilterDTO = z.infer<typeof reportFilterSchema>
