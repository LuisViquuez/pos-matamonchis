"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/actions/auth";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/services/products";
import type { CreateProductDTO, UpdateProductDTO } from "@/types/dto";

export async function getProductsListAction() {
  await requireAdmin();
  return getAllProducts();
}

export async function createProductAction(
  data: CreateProductDTO
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await createProduct(data);
    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/pos");
    return { success: true };
  } catch (error) {
    console.error("Error creating product:", error);
    return { success: false, error: "Error al crear el producto" };
  }
}

export async function updateProductAction(
  id: number,
  data: UpdateProductDTO
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await updateProduct(id, data);
    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/pos");
    return { success: true };
  } catch (error) {
    console.error("Error updating product:", error);
    return { success: false, error: "Error al actualizar el producto" };
  }
}

export async function deleteProductAction(
  id: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await deleteProduct(id);
    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/pos");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: "Error al eliminar el producto" };
  }
}
