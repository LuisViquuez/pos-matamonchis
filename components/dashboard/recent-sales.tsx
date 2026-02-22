"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { RecentSale } from "@/types/dto";

interface RecentSalesTableProps {
  sales: RecentSale[];
}

const paymentMethodLabels: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
};

export function RecentSalesTable({ sales }: RecentSalesTableProps) {
  if (sales.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Ventas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <span className="text-2xl">📋</span>
            </div>
            <p className="text-muted-foreground">
              No hay ventas registradas hoy
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Las ventas aparecerán aquí cuando se registren
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Ventas Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                  ID
                </th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                  Cliente
                </th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                  Método
                </th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                  Total
                </th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                  Hora
                </th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr
                  key={sale.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-3 px-2">
                    <span className="text-sm font-mono text-foreground">
                      #{sale.id}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-sm text-foreground">
                      {sale.customer_name || "Cliente General"}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant="secondary" className="font-normal">
                      {paymentMethodLabels[sale.payment_method]}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(sale.total)}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm text-muted-foreground">
                      {new Date(sale.created_at!).toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
