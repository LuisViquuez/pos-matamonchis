"use server";

import prisma from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";
import type { Product } from "@/types/models";
import type { CreateProductDTO, UpdateProductDTO } from "@/types/dto";

/**
 * Función auxiliar para convertir Decimal de Prisma y fechas
 * a tipos simples compatibles con Client Components.
 */
function serializeProduct(product: any): Product {
  if (!product) return product;
  return {
    ...product,
    // Convertimos el objeto Decimal a número de JS
    price: product.price ? Number(product.price) : 0,
    // Aseguramos que las fechas sean strings o se mantengan como Date
    // (Next.js acepta Dates planas, pero no objetos complejos)
    createdAt:
      product.createdAt instanceof Date
        ? product.createdAt.toISOString()
        : product.createdAt,
  } as Product;
}

export async function getProducts(includeInactive = false): Promise<Product[]> {
  await requireAuth();

  const products = await prisma.product.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return products.map(serializeProduct);
}

export async function getProductById(id: number): Promise<Product | null> {
  await requireAuth();

  const product = await prisma.product.findUnique({ where: { id } });
  return product ? serializeProduct(product) : null;
}

export async function getProductsByCategory(
  category: string,
): Promise<Product[]> {
  await requireAuth();

  const products = await prisma.product.findMany({
    where: { category, isActive: true },
    orderBy: { name: "asc" },
  });

  return products.map(serializeProduct);
}

export async function getCategories(): Promise<string[]> {
  await requireAuth();

  const result = await prisma.product.findMany({
    where: { isActive: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
    select: { category: true },
  });
  return result.map((r) => r.category);
}

export async function createProduct(data: CreateProductDTO): Promise<Product> {
  await requireAdmin();

  const result = await prisma.product.create({
    data: {
      name: data.name,
      price: data.price, // Prisma acepta Number aquí y lo convierte a Decimal en DB
      category: data.category,
      stock: data.stock ?? 0,
      imageUrl: data.image_url ?? null,
      isActive: data.is_active ?? true,
    },
  });
  return serializeProduct(result);
}

export async function updateProduct(data: UpdateProductDTO): Promise<Product> {
  await requireAdmin();

  const existing = await prisma.product.findUnique({ where: { id: data.id } });
  if (!existing) {
    throw new Error("Product not found");
  }

  const result = await prisma.product.update({
    where: { id: data.id },
    data: {
      name: data.name ?? existing.name,
      price: data.price ?? existing.price,
      category: data.category ?? existing.category,
      stock: data.stock ?? existing.stock,
      imageUrl:
        data.image_url !== undefined ? data.image_url : existing.imageUrl,
      isActive: data.is_active ?? existing.isActive,
    },
  });
  return serializeProduct(result);
}

export async function deleteProduct(id: number): Promise<void> {
  await requireAdmin();
  await prisma.product.update({ where: { id }, data: { isActive: false } });
}

export async function toggleProductStatus(id: number): Promise<Product> {
  await requireAdmin();
  const current = await prisma.product.findUnique({ where: { id } });
  if (!current) throw new Error("Product not found");

  const result = await prisma.product.update({
    where: { id },
    data: { isActive: !current.isActive },
  });
  return serializeProduct(result);
}

// Alias exports
export async function getAllProducts(): Promise<Product[]> {
  return getProducts(true);
}

export async function getActiveProducts(): Promise<Product[]> {
  return getProducts(false);
}

export async function updateProductStock(
  productId: number,
  quantityChange: number,
): Promise<void> {
  await requireAuth();
  await prisma.product.update({
    where: { id: productId },
    data: { stock: { increment: quantityChange } },
  });
}
