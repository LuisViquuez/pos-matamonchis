"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { HourlySales } from "@/types/dto";

interface SalesChartProps {
  data: HourlySales[];
}

export function SalesChart({ data }: SalesChartProps) {
  const chartData = data.map((item) => ({
    hour: `${item.hour}:00`,
    ventas: Number(item.total),
  }));

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Ventas por Hora</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No hay datos de ventas para mostrar
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.65 0.2 350)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.65 0.2 350)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="hour"
                tick={{ fill: "oklch(0.5 0.02 350)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "oklch(0.5 0.02 350)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(1 0 0)",
                  border: "1px solid oklch(0.9 0.02 350)",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Ventas"]}
              />
              <Area
                type="monotone"
                dataKey="ventas"
                stroke="oklch(0.65 0.2 350)"
                fill="url(#colorVentas)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
