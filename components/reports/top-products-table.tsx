"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { TopProduct } from "@/types/dto";

interface TopProductsTableProps {
  products: TopProduct[];
}

export function TopProductsTable({ products }: TopProductsTableProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Productos Más Vendidos</CardTitle>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No hay datos de productos para mostrar
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product, index) => (
              <div
                key={product.product_name}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {product.product_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.quantity_sold} unidades vendidas
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(product.total_revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
