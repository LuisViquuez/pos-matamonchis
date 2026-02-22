import { z } from "zod";

// Auth DTOs
export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "El correo o usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
  rememberMe: z.boolean().default(false),
});

export type LoginDTO = z.infer<typeof loginSchema>;

// Product DTOs
export const createProductSchema = z.object({
  name: z.string().min(1, "El nombre del producto es requerido").max(150),
  price: z.number().positive("El precio debe ser positivo"),
  category: z.string().min(1, "La categoría es requerida").max(100),
  stock: z.number().int().min(0, "El stock no puede ser negativo").default(0),
  image_url: z.string().url().nullable().optional(),
  is_active: z.boolean().default(true),
});

export type CreateProductDTO = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.number(),
});

export type UpdateProductDTO = z.infer<typeof updateProductSchema>;

// User DTOs
export const createUserSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(120),
  email: z
    .string()
    .email("Correo inválido")
    .max(150, "El correo no puede tener más de 150 caracteres"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(16, "La contraseña no puede tener más de 16 caracteres"),
  role: z.enum(["admin", "cashier"]),
  is_active: z.boolean().default(true),
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "El nombre es requerido").max(120).optional(),
  email: z
    .string()
    .email("Correo inválido")
    .max(150, "El correo no puede tener más de 150 caracteres")
    .optional(),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(16, "La contraseña no puede tener más de 16 caracteres")
    .optional(),
  role: z.enum(["admin", "cashier"]).optional(),
  is_active: z.boolean().optional(),
});

export type UpdateUserDTO = z.infer<typeof updateUserSchema>;

// Sale DTOs
export const saleItemSchema = z.object({
  product_id: z.number(),
  product_name: z.string(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  subtotal: z.number(),
  promotion_applied: z.string().nullable().optional(),
});

export const createSaleSchema = z.object({
  customer_id: z.number().nullable().optional(),
  customer_name: z.string().max(150).nullable().optional(),
  subtotal: z.number(),
  tax: z.number(),
  discount: z.number(),
  total: z.number(),
  payment_method: z.enum(["cash", "card", "transfer"]),
  cash_received: z.number().nullable().optional(),
  change_amount: z.number().nullable().optional(),
  items: z.array(saleItemSchema).min(1, "Se requiere al menos un artículo"),
});

export type CreateSaleDTO = z.infer<typeof createSaleSchema>;
export type SaleItemDTO = z.infer<typeof saleItemSchema>;

// Payment DTOs
export const cashPaymentSchema = z.object({
  method: z.literal("cash"),
  cashReceived: z.number().positive("El monto debe ser positivo"),
});

export const cardPaymentSchema = z.object({
  method: z.literal("card"),
  cardNumber: z
    .string()
    .regex(/^\d{16}$/, "El número de tarjeta debe tener 16 dígitos"),
  cardHolder: z.string().min(1, "El nombre del titular es requerido"),
  expiration: z
    .string()
    .regex(
      /^(0[1-9]|1[0-2])\/\d{2}$/,
      "Formato de vencimiento inválido (MM/AA)",
    ),
  cvv: z.string().regex(/^\d{3,4}$/, "El CVV debe tener 3 o 4 dígitos"),
});

export type CashPaymentDTO = z.infer<typeof cashPaymentSchema>;
export type CardPaymentDTO = z.infer<typeof cardPaymentSchema>;

// Report Filter DTOs
export const reportFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type ReportFilterDTO = z.infer<typeof reportFilterSchema>;

// POS Cart types
export interface CartItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  /** Stock disponible del producto al momento de agregarlo al carrito */
  stock: number;
  /** Descuento del ítem (calculado por el backend) */
  item_discount?: number;
  /** Nombre de la promoción aplicada al ítem */
  promotion_applied?: string | null;
  /** @deprecated use item_discount */
  discount?: number;
}

// ──────────────────────────────────────────────
// Promotion evaluation DTOs (resultado del PromotionEngine)
// ──────────────────────────────────────────────

/** Ítem evaluado que devuelve el backend */
export interface EvaluatedItemDTO {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  item_discount: number;
  promotion_applied: string | null;
}

/** Resultado completo de evaluar las promociones de un carrito */
export interface PromotionEvaluationResult {
  items: EvaluatedItemDTO[];
  subtotal: number;
  promotion_discount: number;
  custom_discount: number;
  total_discount: number;
  tax: number;
  total: number;
  active_promotion: "2x1" | "custom" | null;
  promotion_message: string | null;
  can_apply_custom_discount: boolean;
  custom_discount_percent: number;
}

// Sale with items (for receipts)
export interface SaleWithItems {
  id: number;
  customer_name: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
  cash_received: number | null;
  change_amount: number | null;
  created_at: Date | string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
}

// Recent sale row returned by getRecentSales()
export interface RecentSale {
  id: number;
  customer_name: string | null;
  total: number;
  payment_method: string;
  created_at: string;
  user_name: string;
}

// Dashboard daily summary (matches getTodaySummary return type)
export interface DailySummary {
  totalSales: number;
  totalRevenue: number;
  avgTicket: number;
  totalProducts: number;
}

// Full reports summary (matches getSalesReport return type)
export interface SalesReport {
  totalSales: number;
  totalRevenue: number;
  avgTicket: number;
  totalProducts: number;
  salesByPaymentMethod: PaymentMethodSummary[];
  dailySales: Array<{ date: string; count: number; total: number }>;
}

// Payment method breakdown
export interface PaymentMethodSummary {
  payment_method: string;
  count: number;
  total: number;
}

// Top product row (matches getTopProducts SQL alias)
export interface TopProduct {
  product_id: number;
  product_name: string;
  quantity_sold: number;
  total_revenue: number;
}

// Hourly sales row (matches getSalesByHour return type)
export interface HourlySales {
  hour: number;
  count: number;
  total: number;
}
