'use server'

import { sql } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import type { Sale, SaleItem, Promotion } from '@/types/models'
import type { CreateSaleDTO } from '@/types/dto'

export async function getPromotions(): Promise<Promotion[]> {
  await requireAuth()
  
  const promotions = await sql`
    SELECT * FROM promotions WHERE is_active = true
  `
  return promotions as Promotion[]
}

export async function createSale(data: CreateSaleDTO, userId: number): Promise<Sale> {
  await requireAuth()
  
  // Insert sale
  const saleResult = await sql`
    INSERT INTO sales (
      customer_id, user_id, customer_name, subtotal, tax, discount, total,
      payment_method, cash_received, change_amount
    )
    VALUES (
      ${data.customer_id || null},
      ${userId},
      ${data.customer_name || null},
      ${data.subtotal},
      ${data.tax},
      ${data.discount},
      ${data.total},
      ${data.payment_method},
      ${data.cash_received || null},
      ${data.change_amount || null}
    )
    RETURNING *
  `
  
  const sale = (saleResult as Sale[])[0]
  
  // Insert sale items
  for (const item of data.items) {
    await sql`
      INSERT INTO sale_items (
        sale_id, product_id, product_name, quantity, unit_price, subtotal, promotion_applied
      )
      VALUES (
        ${sale.id},
        ${item.product_id},
        ${item.product_name},
        ${item.quantity},
        ${item.unit_price},
        ${item.subtotal},
        ${item.promotion_applied || null}
      )
    `
    
    // Update product stock
    await sql`
      UPDATE products SET stock = stock - ${item.quantity} WHERE id = ${item.product_id}
    `
  }
  
  return sale
}

export async function getSales(limit = 100): Promise<Sale[]> {
  await requireAuth()
  
  const sales = await sql`
    SELECT s.*, u.name as user_name
    FROM sales s
    LEFT JOIN users u ON s.user_id = u.id
    ORDER BY s.created_at DESC
    LIMIT ${limit}
  `
  return sales as Sale[]
}

export async function getSaleById(id: number): Promise<{ sale: Sale; items: SaleItem[] } | null> {
  await requireAuth()
  
  const sales = await sql`
    SELECT s.*, u.name as user_name
    FROM sales s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.id = ${id}
    LIMIT 1
  `
  
  if ((sales as Sale[]).length === 0) {
    return null
  }
  
  const items = await sql`
    SELECT * FROM sale_items WHERE sale_id = ${id}
  `
  
  return {
    sale: (sales as Sale[])[0],
    items: items as SaleItem[],
  }
}

export async function getSalesByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
  await requireAuth()
  
  const sales = await sql`
    SELECT s.*, u.name as user_name
    FROM sales s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.created_at >= ${startDate}::timestamp
    AND s.created_at <= ${endDate}::timestamp
    ORDER BY s.created_at DESC
  `
  return sales as Sale[]
}

export async function getSaleItems(saleId: number): Promise<SaleItem[]> {
  await requireAuth()
  
  const items = await sql`
    SELECT * FROM sale_items WHERE sale_id = ${saleId}
  `
  return items as SaleItem[]
}
