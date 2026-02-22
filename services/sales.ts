"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import type { Sale, SaleItem, Promotion } from "@/types/models";
import type { CreateSaleDTO } from "@/types/dto";

// ── Serializers: convert Prisma Decimal → plain number so Next.js can pass
// these objects from Server Components to Client Components safely. ──────────

function serializeSale(sale: any): Sale {
  // Construct a plain object with ONLY serializable fields — no Decimal objects.
  return {
    id: sale.id,
    customer_id: sale.customerId ?? null,
    user_id: sale.userId,
    customer_name: sale.customerName ?? null,
    subtotal: Number(sale.subtotal),
    tax: Number(sale.tax),
    discount: Number(sale.discount),
    total: Number(sale.total),
    payment_method: sale.paymentMethod,
    cash_received: sale.cashReceived != null ? Number(sale.cashReceived) : null,
    change_amount: sale.changeAmount != null ? Number(sale.changeAmount) : null,
    created_at:
      sale.createdAt instanceof Date
        ? sale.createdAt.toISOString()
        : sale.createdAt,
    user_name: sale.user?.name ?? null,
  } as unknown as Sale;
}

function serializeSaleItem(item: any): SaleItem {
  // Construct a plain object with ONLY serializable fields — no Decimal objects.
  return {
    id: item.id,
    sale_id: item.saleId,
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    unit_price: Number(item.unitPrice),
    subtotal: Number(item.subtotal),
    promotion_applied: item.promotionApplied ?? null,
  } as unknown as SaleItem;
}

export async function getPromotions(): Promise<Promotion[]> {
  await requireAuth();

  const promotions = await prisma.promotion.findMany({
    where: { isActive: true },
  });
  return promotions as unknown as Promotion[];
}

export async function createSale(
  data: CreateSaleDTO,
  userId: number,
): Promise<Sale> {
  await requireAuth();

  // Create sale and items in a transaction
  const sale = await prisma.$transaction(async (tx) => {
    const createdSale = await tx.sale.create({
      data: {
        customerId: data.customer_id ?? null,
        userId,
        customerName: data.customer_name ?? null,
        subtotal: data.subtotal,
        tax: data.tax,
        discount: data.discount,
        total: data.total,
        paymentMethod: data.payment_method,
        cashReceived: data.cash_received ?? null,
        changeAmount: data.change_amount ?? null,
      },
    });

    for (const item of data.items) {
      await tx.saleItem.create({
        data: {
          saleId: createdSale.id,
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          subtotal: item.subtotal,
          promotionApplied: item.promotion_applied ?? null,
        },
      });

      await tx.product.update({
        where: { id: item.product_id },
        data: { stock: { decrement: item.quantity } as any },
      });
    }

    return createdSale;
  });

  return sale as unknown as Sale;
}

export async function getSales(limit = 100): Promise<Sale[]> {
  await requireAuth();

  const sales = await prisma.sale.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return sales.map(serializeSale);
}

export async function getSaleById(
  id: number,
): Promise<{ sale: Sale; items: SaleItem[] } | null> {
  await requireAuth();

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { items: true, user: { select: { name: true } } },
  });
  if (!sale) return null;
  return {
    sale: serializeSale(sale),
    items: sale.items.map(serializeSaleItem),
  };
}

export async function getSalesByDateRange(
  startDate: string,
  endDate: string,
): Promise<Sale[]> {
  await requireAuth();

  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return sales.map(serializeSale);
}

export async function getSaleItems(saleId: number): Promise<SaleItem[]> {
  await requireAuth();

  const items = await prisma.saleItem.findMany({ where: { saleId } });
  return items.map(serializeSaleItem);
}
