"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Banknote, Receipt, TrendingUp, ShoppingBag } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { SalesReport } from "@/types/dto";

interface ReportsHeaderProps {
  period: string;
  startDate: Date;
  endDate: Date;
  summary: SalesReport;
}

const periods = [
  { id: "today", label: "Hoy" },
  { id: "week", label: "Semana" },
  { id: "month", label: "Mes" },
];

export function ReportsHeader({ period, summary }: ReportsHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeSummary = {
    total_sales: summary?.total_sales ?? 0,
    total_transactions: summary?.total_transactions ?? 0,
    average_ticket: summary?.average_ticket ?? 0,
    items_sold: summary?.items_sold ?? 0,
  };

  const handlePeriodChange = (newPeriod: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", newPeriod);
    router.push(`/dashboard/reports?${params.toString()}`);
  };

  const stats = [
    {
      title: "Ventas Totales",
      value: formatCurrency(safeSummary.total_sales),
      icon: Banknote,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Transacciones",
      value: safeSummary.total_transactions.toString(),
      icon: Receipt,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Ticket Promedio",
      value: formatCurrency(safeSummary.average_ticket),
      icon: TrendingUp,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: "Productos Vendidos",
      value: safeSummary.items_sold.toString(),
      icon: ShoppingBag,
      color: "text-chart-5",
      bgColor: "bg-chart-5/10",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
          <p className="text-muted-foreground">
            Análisis de ventas y rendimiento del negocio
          </p>
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {periods.map((p) => (
            <Button
              key={p.id}
              variant="ghost"
              size="sm"
              onClick={() => handlePeriodChange(p.id)}
              className={cn("px-4", period === p.id && "bg-card shadow-sm")}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
