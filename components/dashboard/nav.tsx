"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions/auth";
import type { AuthUser } from "@/types/models";
import {
  Home,
  ShoppingCart,
  BarChart3,
  Package,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface DashboardNavProps {
  user: AuthUser;
}

function BrandLogo({ className }: { className?: string }) {
  return (
    <img src="/logos/sinfondo.png" alt="La Matamonchis" className={className} />
  );
}

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/dashboard/pos", label: "Punto de Venta", icon: ShoppingCart },
  // { href: "/dashboard/reports", label: "Reportes", icon: BarChart3 },
  {
    href: "/dashboard/products",
    label: "Productos",
    icon: Package,
    adminOnly: true,
  },
  { href: "/dashboard/users", label: "Usuarios", icon: Users, adminOnly: true },
];

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || user.role === "admin",
  );

  return (
    <>
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between h-16 px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
              <BrandLogo className="h-full w-full object-contain p-1.5" />
            </div>
            <span className="font-semibold text-foreground">MATAMONCHIS</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-card border-r border-border transition-[transform,width] duration-300 lg:z-40 lg:translate-x-0 lg:h-screen",
          isDesktopCollapsed ? "lg:w-20" : "lg:w-64",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col justify-between">
          <div className="min-h-0 flex flex-col">
            {/* Logo */}
            <div
              className={cn(
                "h-16 flex items-center border-b border-border",
                isDesktopCollapsed ? "justify-center px-2" : "gap-3 px-4",
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden flex items-center justify-center shadow-md">
                <BrandLogo className="h-full w-full object-contain p-1.5" />
              </div>
              {!isDesktopCollapsed && (
                <div>
                  <h1 className="font-bold text-foreground leading-tight">
                    LA MATAMONCHIS
                  </h1>
                  <p className="text-xs text-muted-foreground">Sistema POS</p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
              {filteredItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isDesktopCollapsed ? "justify-center" : "gap-3",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                    title={isDesktopCollapsed ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5" />
                    {!isDesktopCollapsed && <span>{item.label}</span>}
                    {!isDesktopCollapsed && isActive && (
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-border">
            {/* User section */}
            <div className="p-3">
              <div
                className={cn(
                  "flex px-3 py-2 rounded-lg bg-muted/50",
                  isDesktopCollapsed
                    ? "items-center justify-center"
                    : "items-center gap-3",
                )}
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {!isDesktopCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user.role === "admin" ? "Administrador" : "Cajero"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom actions */}
            <div className="p-3 pt-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                className={cn(
                  "hidden lg:flex w-full text-muted-foreground hover:text-foreground",
                  isDesktopCollapsed ? "justify-center" : "justify-start gap-3",
                )}
                onClick={() => setIsDesktopCollapsed((current) => !current)}
                title={isDesktopCollapsed ? "Expandir menú" : "Colapsar menú"}
              >
                {isDesktopCollapsed ? (
                  <PanelLeftOpen className="h-5 w-5" />
                ) : (
                  <PanelLeftClose className="h-5 w-5" />
                )}
                {!isDesktopCollapsed && "Colapsar menú"}
              </Button>
              <form action={logoutAction} className="mt-2">
                <Button
                  type="submit"
                  variant="ghost"
                  className={cn(
                    "w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                    isDesktopCollapsed
                      ? "justify-center"
                      : "justify-start gap-3",
                  )}
                  title={isDesktopCollapsed ? "Cerrar Sesión" : undefined}
                >
                  <LogOut className="h-5 w-5" />
                  {!isDesktopCollapsed && "Cerrar Sesión"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      {/* Desktop spacer so content is always offset from fixed sidebar */}
      <div
        aria-hidden
        className={cn(
          "hidden lg:block lg:shrink-0 transition-[width] duration-300",
          isDesktopCollapsed ? "lg:w-20" : "lg:w-64",
        )}
      />

      {/* Mobile spacer */}
      <div className="lg:hidden h-16" />
    </>
  );
}
