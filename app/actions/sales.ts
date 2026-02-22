"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/app/actions/auth";
import { createSale, getSaleById } from "@/services/sales";
import {
  evaluatePromotions,
  type EvaluationItem,
} from "@/lib/promotion-engine";
import type {
  CreateSaleDTO,
  SaleWithItems,
  PromotionEvaluationResult,
} from "@/types/dto";
import { getActiveProducts, getProductById } from "@/services/products";

export async function getProductsAction() {
  const products = await getActiveProducts();
  return products;
}

/**
 * Evalúa las promociones del carrito en el servidor.
 * El frontend llama esto cada vez que el carrito cambia.
 */
export async function evaluatePromotionsAction(
  items: EvaluationItem[],
  customDiscountPercent = 0,
): Promise<{
  success: boolean;
  result?: PromotionEvaluationResult;
  error?: string;
}> {
  try {
    await requireAuth();
    const result = await evaluatePromotions(items, customDiscountPercent);
    return { success: true, result };
  } catch (error) {
    console.error("Error evaluating promotions:", error);
    return { success: false, error: "Error al evaluar promociones" };
  }
}

export async function createSaleAction(
  data: CreateSaleDTO,
  customDiscountPercent = 0,
): Promise<{ success: boolean; saleId?: number; error?: string }> {
  try {
    const user = await requireAuth();

    // Re-evaluar promociones en el backend — NUNCA confiar en los totales del cliente
    const evaluationItems: EvaluationItem[] = data.items.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const promoResult = await evaluatePromotions(
      evaluationItems,
      customDiscountPercent,
    );

    // Construir el DTO con valores recalculados por el backend
    const verifiedData: CreateSaleDTO = {
      ...data,
      subtotal: promoResult.subtotal,
      tax: promoResult.tax,
      discount: promoResult.total_discount,
      total: promoResult.total,
      items: promoResult.items.map((ei) => ({
        product_id: ei.product_id,
        product_name: ei.product_name,
        quantity: ei.quantity,
        unit_price: ei.unit_price,
        subtotal: ei.subtotal,
        promotion_applied: ei.promotion_applied ?? undefined,
      })),
    };

    // Pre-validar stock disponible antes de iniciar la transacción
    // (la transacción es la fuente de verdad, pero este check da un error
    // más rápido y amigable para el cajero)
    for (const item of verifiedData.items) {
      const product = await getProductById(item.product_id);
      if (!product || !product.is_active) {
        return {
          success: false,
          error: `Producto "${item.product_name}" no encontrado o inactivo`,
        };
      }
      if (product.stock < item.quantity) {
        return {
          success: false,
          error:
            `Stock insuficiente para "${item.product_name}". ` +
            `Disponible: ${product.stock} unidad(es), solicitado: ${item.quantity}`,
        };
      }
    }

    // createSale decrementa el stock atómicamente dentro de la transacción
    const sale = await createSale(verifiedData, user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/pos");
    revalidatePath("/dashboard/reports");

    return { success: true, saleId: sale.id };
  } catch (error) {
    console.error("Error creating sale:", error);
    // Propagar mensaje específico (ej. stock insuficiente desde la transacción)
    const message =
      error instanceof Error ? error.message : "Error al procesar la venta";
    return { success: false, error: message };
  }
}

export async function getSaleDetailsAction(
  saleId: number,
): Promise<SaleWithItems | null> {
  try {
    const result = await getSaleById(saleId);
    if (!result) return null;

    return { ...result.sale, items: result.items };
  } catch (error) {
    console.error("Error getting sale details:", error);
    return null;
  }
}
