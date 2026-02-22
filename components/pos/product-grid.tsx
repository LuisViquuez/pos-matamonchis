"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/models";

/** Stock equal or below this threshold shows a "low stock" warning. */
const LOW_STOCK_THRESHOLD = 5;

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg border border-border/50">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-foreground">No hay productos</p>
        <p className="text-sm text-muted-foreground mt-1">
          No se encontraron productos con los filtros seleccionados
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
        {products.map((product) => {
          const isOutOfStock = product.stock === 0;
          const isLowStock =
            !isOutOfStock && product.stock <= LOW_STOCK_THRESHOLD;

          return (
            <Card
              key={product.id}
              className={cn(
                "group relative overflow-hidden border-border/50 transition-colors",
                isOutOfStock
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:border-primary/50 cursor-pointer",
              )}
              onClick={() => !isOutOfStock && onAddToCart(product)}
            >
              {/* Out-of-stock overlay */}
              {isOutOfStock && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
                  <Badge
                    variant="destructive"
                    className="text-xs font-bold px-3 py-1 rotate-[-8deg] shadow-md"
                  >
                    Agotado
                  </Badge>
                </div>
              )}

              <div className="aspect-square bg-linear-to-br from-primary/5 to-accent/10 flex items-center justify-center p-4">
                <span className="text-4xl">
                  {getCategoryEmoji(product.category)}
                </span>
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-tight">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold">
                    {formatCurrency(product.price)}
                  </span>
                  {!isOutOfStock && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(product);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p
                  className={cn(
                    "text-xs mt-1 font-medium",
                    isLowStock
                      ? "text-amber-500 dark:text-amber-400"
                      : "text-muted-foreground",
                  )}
                >
                  {isOutOfStock
                    ? "Sin stock"
                    : isLowStock
                      ? `⚠️ Últimas ${product.stock} unidad(es)`
                      : `Stock: ${product.stock}`}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    Gomitas: "🍬",
    Paletas: "🍭",
    Chocolates: "🍫",
    Chicles: "🫧",
    Caramelos: "🍬",
    "Dulces Típicos": "🌮",
  };
  return emojis[category] || "🍬";
}
