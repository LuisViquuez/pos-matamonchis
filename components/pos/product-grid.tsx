"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";
import type { Product } from "@/types/models";

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
        {products.map((product) => (
          <Card
            key={product.id}
            className="group relative overflow-hidden border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => onAddToCart(product)}
          >
            <div className="aspect-square bg-gradient-to-br from-primary/5 to-accent/10 flex items-center justify-center p-4">
              <span className="text-4xl">
                {getCategoryEmoji(product.category)}
              </span>
            </div>
            <div className="p-3">
              <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-tight">
                {product.name}
              </h3>
              <div className="flex items-center justify-between mt-2">
                <span className="text-lg font-bold ">
                  ${Number(product.price).toFixed(2)}
                </span>
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
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Stock: {product.stock}
              </p>
            </div>
          </Card>
        ))}
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
