'use server'

import { sql } from '@/lib/db'
import { requireAuth, requireAdmin } from '@/lib/auth'
import type { Product } from '@/types/models'
import type { CreateProductDTO, UpdateProductDTO } from '@/types/dto'

export async function getProducts(includeInactive = false): Promise<Product[]> {
  await requireAuth()
  
  if (includeInactive) {
    const products = await sql`
      SELECT * FROM products ORDER BY category, name
    `
    return products as Product[]
  }
  
  const products = await sql`
    SELECT * FROM products WHERE is_active = true ORDER BY category, name
  `
  return products as Product[]
}

export async function getProductById(id: number): Promise<Product | null> {
  await requireAuth()
  
  const products = await sql`
    SELECT * FROM products WHERE id = ${id} LIMIT 1
  `
  return (products as Product[])[0] || null
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  await requireAuth()
  
  const products = await sql`
    SELECT * FROM products WHERE category = ${category} AND is_active = true ORDER BY name
  `
  return products as Product[]
}

export async function getCategories(): Promise<string[]> {
  await requireAuth()
  
  const result = await sql`
    SELECT DISTINCT category FROM products WHERE is_active = true ORDER BY category
  `
  return (result as { category: string }[]).map(r => r.category)
}

export async function createProduct(data: CreateProductDTO): Promise<Product> {
  await requireAdmin()
  
  const result = await sql`
    INSERT INTO products (name, price, category, stock, image_url, is_active)
    VALUES (${data.name}, ${data.price}, ${data.category}, ${data.stock || 0}, ${data.image_url || null}, ${data.is_active ?? true})
    RETURNING *
  `
  return (result as Product[])[0]
}

export async function updateProduct(data: UpdateProductDTO): Promise<Product> {
  await requireAdmin()
  
  const existing = await getProductById(data.id)
  if (!existing) {
    throw new Error('Product not found')
  }
  
  const result = await sql`
    UPDATE products SET
      name = ${data.name ?? existing.name},
      price = ${data.price ?? existing.price},
      category = ${data.category ?? existing.category},
      stock = ${data.stock ?? existing.stock},
      image_url = ${data.image_url !== undefined ? data.image_url : existing.image_url},
      is_active = ${data.is_active ?? existing.is_active}
    WHERE id = ${data.id}
    RETURNING *
  `
  return (result as Product[])[0]
}

export async function deleteProduct(id: number): Promise<void> {
  await requireAdmin()
  
  // Soft delete - just deactivate
  await sql`
    UPDATE products SET is_active = false WHERE id = ${id}
  `
}

export async function toggleProductStatus(id: number): Promise<Product> {
  await requireAdmin()
  
  const result = await sql`
    UPDATE products SET is_active = NOT is_active WHERE id = ${id} RETURNING *
  `
  return (result as Product[])[0]
}

// Alias exports for compatibility
export async function getAllProducts(): Promise<Product[]> {
  return getProducts(true)
}

export async function getActiveProducts(): Promise<Product[]> {
  return getProducts(false)
}

export async function updateProductStock(productId: number, quantityChange: number): Promise<void> {
  await requireAuth()
  
  await sql`
    UPDATE products SET stock = stock + ${quantityChange} WHERE id = ${productId}
  `
}
