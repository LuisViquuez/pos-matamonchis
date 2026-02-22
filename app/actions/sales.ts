"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/app/actions/auth";
import { createSale, getSaleById } from "@/services/sales";
import { getActiveProducts, updateProductStock } from "@/services/products";
import type { CreateSaleDTO, SaleWithItems } from "@/types/dto";

export async function getProductsAction() {
  const products = await getActiveProducts();
  return products;
}

export async function createSaleAction(
  data: CreateSaleDTO,
): Promise<{ success: boolean; saleId?: number; error?: string }> {
  try {
    const user = await requireAuth();

    // Create sale with user ID
    const sale = await createSale(data, user.id);

    // Update stock for each item
    for (const item of data.items) {
      await updateProductStock(item.product_id, -item.quantity);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/pos");
    revalidatePath("/dashboard/reports");

    return { success: true, saleId: sale.id };
  } catch (error) {
    console.error("Error creating sale:", error);
    return { success: false, error: "Error al procesar la venta" };
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
