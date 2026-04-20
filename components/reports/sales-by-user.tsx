"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { SalesByUser } from "@/types/models";

interface SalesByUserProps {
  data: SalesByUser[];
}

export function SalesByUser({ data }: SalesByUserProps) {
  const totalAmount = data.reduce(
    (sum, item) => sum + Number(item.total_sales),
    0,
  );
  const totalSales = data.reduce((sum, item) => sum + item.sale_count, 0);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Ventas por Vendedor</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No hay datos de vendedores para mostrar
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Vendedor
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                      # Ventas
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                      Monto Total
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                      Promedio por Venta
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => {
                    const avgSale =
                      item.sale_count > 0
                        ? Number(item.total_sales) / item.sale_count
                        : 0;

                    return (
                      <tr
                        key={item.user_id}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-3 px-2">
                          <Badge variant="outline" className="font-normal">
                            {item.user_name}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-sm font-medium text-foreground">
                            {item.sale_count}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-sm font-semibold text-foreground">
                            {formatCurrency(item.total_sales)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(avgSale)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary row */}
            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Total</span>
              <div className="flex gap-8 text-right">
                <div>
                  <span className="text-sm text-muted-foreground">
                    {totalSales} ventas
                  </span>
                </div>
                <div className="w-40">
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
