"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Banknote, ShoppingBag, TrendingUp, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { DailySummary } from "@/types/dto";

interface DashboardStatsProps {
  summary: DailySummary;
}

export function DashboardStats({ summary }: DashboardStatsProps) {
  const safeSummary = {
    total_sales: summary?.total_sales ?? 0,
    total_transactions: summary?.total_transactions ?? 0,
    average_ticket: summary?.average_ticket ?? 0,
    items_sold: summary?.items_sold ?? 0,
  };
  const stats = [
    {
      title: "Ventas del Día",
      value: formatCurrency(safeSummary.total_sales),
      icon: Banknote,
      description: "Total en ventas hoy",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Transacciones",
      value: safeSummary.total_transactions.toString(),
      icon: Receipt,
      description: "Ventas realizadas",
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Ticket Promedio",
      value: formatCurrency(safeSummary.average_ticket),
      icon: TrendingUp,
      description: "Promedio por venta",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: "Productos Vendidos",
      value: safeSummary.items_sold.toString(),
      icon: ShoppingBag,
      description: "Unidades vendidas",
      color: "text-chart-5",
      bgColor: "bg-chart-5/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
                <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
