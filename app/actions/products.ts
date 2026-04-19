"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireAuth } from "@/app/actions/auth";
import {
  getProductById,
  getAllProducts,
  getActiveProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  saveProductImage,
} from "@/services/products";
import type { Product } from "@/types/models";

function readStringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readRequiredStringField(formData: FormData, key: string) {
  const value = readStringField(formData, key);
  if (!value) {
    throw new Error(`El campo ${key} es requerido`);
  }
  return value;
}

function readBooleanField(formData: FormData, key: string, fallback: boolean) {
  const value = formData.get(key);
  if (value == null) return fallback;
  if (typeof value === "string") {
    return ["true", "on", "1"].includes(value.toLowerCase());
  }
  return fallback;
}

function readNumberField(formData: FormData, key: string) {
  const value = readRequiredStringField(formData, key);
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`El campo ${key} es inválido`);
  }
  return parsed;
}

function readProductImage(formData: FormData) {
  const value = formData.get("image");
  if (value instanceof File && value.size > 0) {
    return value;
  }
  return null;
}

function parseProductFormData(formData: FormData, isUpdate = false) {
  const idValue = readStringField(formData, "id");
  const id = idValue ? Number(idValue) : undefined;

  if (isUpdate && (!id || Number.isNaN(id))) {
    throw new Error("El producto no es válido");
  }

  return {
    id,
    name: readRequiredStringField(formData, "name"),
    price: (() => {
      const parsed = readNumberField(formData, "price");
      if (parsed <= 0) {
        throw new Error("El precio debe ser mayor a cero");
      }
      return parsed;
    })(),
    category: readRequiredStringField(formData, "category"),
    stock: (() => {
      const parsed = readNumberField(formData, "stock");
      if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error("El stock debe ser un entero mayor o igual a cero");
      }
      return parsed;
    })(),
    is_active: readBooleanField(formData, "is_active", true),
    imageFile: readProductImage(formData),
  };
}

export async function getProductsListAction() {
  await requireAdmin();
  return getAllProducts();
}

export async function getActiveProductsListAction() {
  await requireAuth();
  return getActiveProducts();
}

export async function createProductAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string; product?: Product }> {
  try {
    await requireAdmin();
    const data = parseProductFormData(formData);
    let imageUrl: string | null = null;

    try {
      if (data.imageFile) {
        imageUrl = await saveProductImage(data.imageFile);
      }

      const product = await createProduct({
        name: data.name,
        price: data.price,
        category: data.category,
        stock: data.stock,
        image_url: imageUrl,
        is_active: data.is_active,
      });

      revalidatePath("/dashboard/products");
      revalidatePath("/dashboard/pos");
      return { success: true, product };
    } catch (error) {
      if (imageUrl) {
        await deleteProductImage(imageUrl);
      }
      throw error;
    }
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al crear el producto",
    };
  }
}

export async function updateProductAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string; product?: Product }> {
  try {
    await requireAdmin();
    const data = parseProductFormData(formData, true);
    const existing = await getProductById(data.id as number);

    if (!existing) {
      throw new Error("Producto no encontrado");
    }

    let imageUrl = existing.image_url;
    let newImageUrl: string | null = null;

    try {
      if (data.imageFile) {
        newImageUrl = await saveProductImage(data.imageFile);
        imageUrl = newImageUrl;
      }

      const product = await updateProduct({
        id: data.id as number,
        name: data.name,
        price: data.price,
        category: data.category,
        stock: data.stock,
        image_url: imageUrl,
        is_active: data.is_active,
      });

      if (newImageUrl && existing.image_url) {
        await deleteProductImage(existing.image_url);
      }

      revalidatePath("/dashboard/products");
      revalidatePath("/dashboard/pos");
      return { success: true, product };
    } catch (error) {
      if (newImageUrl) {
        await deleteProductImage(newImageUrl);
      }
      throw error;
    }
  } catch (error) {
    console.error("Error updating product:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al actualizar el producto",
    };
  }
}

export async function deleteProductAction(
  id: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const existing = await getProductById(id);
    await deleteProduct(id);
    if (existing?.image_url) {
      await deleteProductImage(existing.image_url);
    }
    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/pos");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: "Error al eliminar el producto" };
  }
}
