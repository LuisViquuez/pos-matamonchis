"use client";

import React from "react";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Loader2,
  ImageIcon,
  RefreshCw,
} from "lucide-react";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
} from "@/app/actions/products";
import { cn, formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/models";

interface ProductsManagementProps {
  initialProducts: Product[];
}

const categories = ["Snacks", "Helados", "Comidas", "Postres", "Bebidas"];
const statusFilters = [
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
  { value: "all", label: "Todos" },
] as const;

const MAX_PRODUCT_NAME_LENGTH = 30;
const MAX_PRODUCT_VALUE = 999_999;
const MAX_PRICE_DECIMALS = 2;

export function ProductsManagement({
  initialProducts,
}: ProductsManagementProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [statusFilter, setStatusFilter] =
    useState<(typeof statusFilters)[number]["value"]>("active");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshingList, startListRefresh] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    startListRefresh(() => {
      router.refresh();
    });
  }, []);

  const filteredProducts = products.filter((product) => {
    if (statusFilter === "all") {
      return true;
    }

    if (statusFilter === "active") {
      return product.is_active;
    }

    return !product.is_active;
  });

  const handleRefreshList = () => {
    startListRefresh(() => {
      router.refresh();
    });
  };

  const handleCreate = async (formData: FormData) => {
    setIsSubmitting(true);
    const result = await createProductAction(formData);
    if (result.success && result.product) {
      setProducts((current) => [result.product as Product, ...current]);
      setIsCreateOpen(false);
      startListRefresh(() => {
        router.refresh();
      });
    }
    setIsSubmitting(false);
  };

  const handleUpdate = async (id: number, formData: FormData) => {
    setIsSubmitting(true);
    const result = await updateProductAction(formData);
    if (result.success && result.product) {
      setProducts((current) =>
        current.map((product) =>
          product.id === id ? (result.product as Product) : product,
        ),
      );
      setEditProduct(null);
      startListRefresh(() => {
        router.refresh();
      });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;

    const result = await deleteProductAction(id);
    if (result.success) {
      setProducts((current) => current.filter((p) => p.id !== id));
      startListRefresh(() => {
        router.refresh();
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Productos</h1>
          <p className="text-muted-foreground">
            Gestiona el catálogo de productos
          </p>
          {isRefreshingList && (
            <p className="text-xs text-muted-foreground mt-1">
              Actualizando listados de productos...
            </p>
          )}
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Producto</DialogTitle>
            </DialogHeader>
            <ProductForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3 space-y-3">
          <CardTitle className="text-base">Listado de productos</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="">
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(
                    value as (typeof statusFilters)[number]["value"],
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  {statusFilters.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleRefreshList}
              disabled={isRefreshingList || isSubmitting}
              className="w-full sm:w-auto"
            >
              <RefreshCw
                className={cn(" h-4 w-4", isRefreshingList && "animate-spin")}
              />
              Refrescar listado
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">
                No hay productos
              </p>
              <p className="text-sm text-muted-foreground">
                Agrega productos para comenzar
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Producto
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Categoría
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                      Precio
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                      Stock
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                      Estado
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted flex items-center justify-center">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground block">
                              {product.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {product.category}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="secondary">{product.category}</Badge>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(product.price)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="text-sm text-foreground">
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge
                          variant={product.is_active ? "default" : "secondary"}
                        >
                          {product.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
          </DialogHeader>
          {editProduct && (
            <ProductForm
              initialData={editProduct}
              onSubmit={(data: FormData) => handleUpdate(editProduct.id, data)}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

type ProductFormProps = {
  initialData?: Product;
  onSubmit: (data: FormData) => Promise<void>;
  isSubmitting: boolean;
};

function ProductForm({
  initialData,
  onSubmit,
  isSubmitting,
}: ProductFormProps) {
  const existingCategory = initialData?.category;
  const allCategories =
    existingCategory && !categories.includes(existingCategory)
      ? [...categories, existingCategory]
      : categories;

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    price: initialData?.price?.toString() || "",
    category: initialData?.category || categories[0],
    stock: initialData?.stock?.toString() || "0",
    is_active: initialData?.is_active ?? true,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(
    initialData?.image_url || "",
  );
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [imageInputKey, setImageInputKey] = useState(0);
  const previewRef = useRef<string | null>(null);
  const isUpdatingImage =
    isSubmitting && (!!selectedImage || (removeCurrentImage && !!initialData));

  useEffect(() => {
    setFormData({
      name: initialData?.name || "",
      price: initialData?.price?.toString() || "",
      category: initialData?.category || categories[0],
      stock: initialData?.stock?.toString() || "0",
      is_active: initialData?.is_active ?? true,
    });
    setSelectedImage(null);
    setRemoveCurrentImage(false);
    setImageInputKey((current) => current + 1);
    if (previewRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(previewRef.current);
    }
    const nextPreview = initialData?.image_url || "";
    previewRef.current = nextPreview || null;
    setImagePreview(nextPreview);
  }, [initialData]);

  useEffect(() => {
    return () => {
      if (previewRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

  const handleNameChange = (value: string) => {
    setFormData((current) => ({
      ...current,
      name: value.slice(0, MAX_PRODUCT_NAME_LENGTH),
    }));
  };

  const handlePriceChange = (value: string) => {
    if (value === "") {
      setFormData((current) => ({ ...current, price: "" }));
      return;
    }

    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    const [integerPart, decimalPart = ""] = value.split(".");
    if (integerPart.length > 6 || decimalPart.length > MAX_PRICE_DECIMALS) {
      return;
    }

    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed > MAX_PRODUCT_VALUE) {
      setFormData((current) => ({
        ...current,
        price: String(MAX_PRODUCT_VALUE),
      }));
      return;
    }

    setFormData((current) => ({ ...current, price: value }));
  };

  const handleStockChange = (value: string) => {
    if (value === "") {
      setFormData((current) => ({ ...current, stock: "" }));
      return;
    }

    if (!/^\d+$/.test(value)) {
      return;
    }

    const limited = value.slice(0, 6);
    const parsed = Number(limited);
    const clamped = Math.min(parsed, MAX_PRODUCT_VALUE);
    setFormData((current) => ({ ...current, stock: String(clamped) }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedImage(file);
    if (file) {
      setRemoveCurrentImage(false);
    }

    if (previewRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      previewRef.current = previewUrl;
      setImagePreview(previewUrl);
      return;
    }

    const fallbackPreview = removeCurrentImage
      ? ""
      : initialData?.image_url || "";
    previewRef.current = fallbackPreview || null;
    setImagePreview(fallbackPreview);
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setImageInputKey((current) => current + 1);

    if (previewRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }

    const fallbackPreview = removeCurrentImage
      ? ""
      : initialData?.image_url || "";
    previewRef.current = fallbackPreview || null;
    setImagePreview(fallbackPreview);
  };

  const handleToggleRemoveCurrentImage = () => {
    const nextValue = !removeCurrentImage;
    setRemoveCurrentImage(nextValue);

    if (selectedImage) {
      setSelectedImage(null);
      setImageInputKey((current) => current + 1);
    }

    if (previewRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }

    if (nextValue) {
      previewRef.current = null;
      setImagePreview("");
      return;
    }

    const fallbackPreview = initialData?.image_url || "";
    previewRef.current = fallbackPreview || null;
    setImagePreview(fallbackPreview);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = new FormData();
    payload.set("name", formData.name);
    payload.set("price", formData.price);
    payload.set("category", formData.category);
    payload.set("stock", formData.stock);
    payload.set("is_active", String(formData.is_active));

    if (initialData) {
      payload.set("id", String(initialData.id));
    }

    if (selectedImage) {
      payload.set("image", selectedImage);
    }

    payload.set("remove_image", String(removeCurrentImage));

    await onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      encType="multipart/form-data"
    >
      <input
        type="hidden"
        name="is_active"
        value={String(formData.is_active)}
      />
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleNameChange(e.target.value)}
          maxLength={MAX_PRODUCT_NAME_LENGTH}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Precio</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => handlePriceChange(e.target.value)}
            max={MAX_PRODUCT_VALUE}
            min={0}
            inputMode="decimal"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            value={formData.stock}
            onChange={(e) => handleStockChange(e.target.value)}
            max={MAX_PRODUCT_VALUE}
            min={0}
            step={1}
            inputMode="numeric"
            pattern="[0-9]*"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Categoría</Label>
        <Select
          value={formData.category}
          onValueChange={(value) =>
            setFormData({ ...formData, category: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="image">Imagen de portada</Label>
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted flex items-center justify-center">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt={formData.name || "Vista previa de la imagen"}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <input
              key={imageInputKey}
              id="image"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" asChild>
                <label htmlFor="image" className="cursor-pointer">
                  Seleccionar archivo
                </label>
              </Button>
              {selectedImage ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClearImage}
                >
                  Quitar archivo
                </Button>
              ) : null}
              {initialData?.image_url ? (
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    "text-destructive hover:text-destructive",
                    removeCurrentImage && "bg-destructive/10",
                  )}
                  onClick={handleToggleRemoveCurrentImage}
                >
                  {removeCurrentImage
                    ? "Deshacer eliminación"
                    : "Eliminar foto actual"}
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedImage
                ? selectedImage.name
                : removeCurrentImage
                  ? "La foto actual se eliminará al guardar"
                  : "Ningún archivo seleccionado"}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Sube una portada en JPG, PNG, WEBP, GIF o AVIF. Tamaño máximo: 5 MB.
        </p>
      </div>

      {isSubmitting && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>
            {isUpdatingImage
              ? "Actualizando imagen, por favor espera..."
              : "Guardando cambios, por favor espera..."}
          </span>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting
          ? "Guardando..."
          : initialData
            ? "Actualizar Producto"
            : "Crear Producto"}
      </Button>
    </form>
  );
}
