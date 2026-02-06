"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, BarChart3, Package, Users, Plus } from "lucide-react";

interface QuickActionsProps {
  isAdmin: boolean;
}

export function QuickActions({ isAdmin }: QuickActionsProps) {
  const actions = [
    {
      href: "/dashboard/pos",
      label: "Nueva Venta",
      description: "Registrar una venta",
      icon: ShoppingCart,
      primary: true,
    },
    {
      href: "/dashboard/reports",
      label: "Ver Reportes",
      description: "Analizar ventas",
      icon: BarChart3,
    },
    ...(isAdmin
      ? [
          {
            href: "/dashboard/products",
            label: "Productos",
            description: "Gestionar inventario",
            icon: Package,
          },
          {
            href: "/dashboard/users",
            label: "Usuarios",
            description: "Administrar usuarios",
            icon: Users,
          },
        ]
      : []),
  ];

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.href}
              asChild
              variant={action.primary ? "default" : "outline"}
              className="w-full justify-start h-auto py-3 px-4"
            >
              <Link href={action.href}>
                <Icon className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">{action.label}</div>
                  <div className={`text-xs ${action.primary ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {action.description}
                  </div>
                </div>
              </Link>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
