"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { PaymentMethodSummary } from "@/types/dto";

interface PaymentMethodChartProps {
  data: PaymentMethodSummary[];
}

const COLORS = [
  "oklch(0.65 0.2 350)", // primary pink
  "oklch(0.75 0.15 80)", // accent yellow/gold
  "oklch(0.6 0.15 180)", // teal
];

const methodLabels: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
};

export function PaymentMethodChart({ data }: PaymentMethodChartProps) {
  const chartData = data.map((item) => ({
    name: methodLabels[item.payment_method] || item.payment_method,
    value: Number(item.total),
    count: item.count,
  }));

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Métodos de Pago</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No hay datos de pagos para mostrar
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(1 0 0)",
                  border: "1px solid oklch(0.9 0.02 350)",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name,
                ]}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-sm text-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
