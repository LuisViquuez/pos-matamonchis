"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { SalesByPaymentMethod } from "@/types/models";

interface SalesByPaymentTypeProps {
  data: SalesByPaymentMethod[];
}

const paymentMethodLabels: Record<string, string> = {
  cash: "Efectivo",
  sinpe: "SINPE",
};

const paymentMethodColors: Record<string, string> = {
  cash: "bg-green-100 text-green-800",
  sinpe: "bg-blue-100 text-blue-800",
};

export function SalesByPaymentType({ data }: SalesByPaymentTypeProps) {
  const totalAmount = data.reduce((sum, item) => sum + Number(item.total), 0);
  const totalTransactions = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Ventas por Método de Pago</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No hay datos de métodos de pago para mostrar
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Método
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                      Transacciones
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                      Monto Total
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                      Porcentaje
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => {
                    const percentage =
                      totalAmount > 0
                        ? ((Number(item.total) / totalAmount) * 100).toFixed(1)
                        : "0";
                    const methodLabel =
                      paymentMethodLabels[item.payment_method] ||
                      item.payment_method;
                    const colorClass =
                      paymentMethodColors[item.payment_method] ||
                      "bg-gray-100 text-gray-800";

                    return (
                      <tr
                        key={item.payment_method}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-3 px-2">
                          <Badge variant="secondary" className={colorClass}>
                            {methodLabel}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-sm font-medium text-foreground">
                            {item.count}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-sm font-semibold text-foreground">
                            {formatCurrency(item.total)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-sm text-muted-foreground">
                            {percentage}%
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
                    {totalTransactions} transacciones
                  </span>
                </div>
                <div>
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
