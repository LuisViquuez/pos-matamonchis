"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { HourlySales } from "@/types/dto";

interface HourlySalesChartProps {
  data: HourlySales[];
}

export function HourlySalesChart({ data }: HourlySalesChartProps) {
  const chartData = data.map((item) => ({
    hour: `${item.hour}h`,
    transacciones: item.count,
  }));

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Transacciones por Hora</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No hay datos de transacciones para mostrar
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <BarChart data={chartData}>
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
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(1 0 0)",
                  border: "1px solid oklch(0.9 0.02 350)",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [value, "Transacciones"]}
              />
              <Bar
                dataKey="transacciones"
                fill="oklch(0.75 0.15 80)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
