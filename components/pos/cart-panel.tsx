"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/types/dto"; // CartItem is defined in dto.ts

interface CartPanelProps {
  items: CartItem[];
  totals: {
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
  };
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
  onClear: () => void;
  onCheckout: () => void;
}

export function CartPanel({
  items,
  totals,
  onUpdateQuantity,
  onRemove,
  onClear,
  onCheckout,
}: CartPanelProps) {
  return (
    <Card className="h-full flex flex-col border-border/50">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Carrito
          {items.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
              {items.length}
            </span>
          )}
        </CardTitle>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <ShoppingCart className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              El carrito está vacío
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Agrega productos para comenzar
            </p>
          </div>
        ) : (
          <>
            {/* Cart items */}
            <div className="flex-1 overflow-y-auto space-y-2 -mx-2 px-2">
              {items.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.unit_price)} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 bg-transparent"
                      onClick={() =>
                        onUpdateQuantity(item.product_id, item.quantity - 1)
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 bg-transparent"
                      onClick={() =>
                        onUpdateQuantity(item.product_id, item.quantity + 1)
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(item.product_id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-border pt-3 mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA (16%)</span>
                <span className="text-foreground">
                  {formatCurrency(totals.tax)}
                </span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Descuento</span>
                  <span className="text-green-600">
                    {formatCurrency(-totals.discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span className="text-foreground">Total</span>
                <span className="text-primary">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            </div>

            {/* Checkout button */}
            <Button
              className="w-full mt-4 h-12 text-base font-semibold"
              onClick={onCheckout}
            >
              Proceder al Pago
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
