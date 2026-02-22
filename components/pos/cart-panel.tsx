"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Tag,
  Loader2,
  Info,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { CartItem, PromotionEvaluationResult } from "@/types/dto";

interface CartPanelProps {
  items: CartItem[];
  totals: {
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
  };
  promotionResult: PromotionEvaluationResult | null;
  isEvaluating: boolean;
  customDiscountPercent: number;
  onCustomDiscountChange: (percent: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
  onClear: () => void;
  onCheckout: () => void;
}

export function CartPanel({
  items,
  totals,
  promotionResult,
  isEvaluating,
  customDiscountPercent,
  onCustomDiscountChange,
  onUpdateQuantity,
  onRemove,
  onClear,
  onCheckout,
}: CartPanelProps) {
  // Map de product_id → ítem evaluado (para mostrar descuentos por ítem)
  const evaluatedMap = new Map(
    (promotionResult?.items ?? []).map((ei) => [ei.product_id, ei]),
  );

  const canApplyCustom = promotionResult?.can_apply_custom_discount ?? false;
  const isCustomActive = promotionResult?.active_promotion === "custom";
  const is2x1Active = promotionResult?.active_promotion === "2x1";

  // Checkbox on/off — independent of the typed value so clearing the field
  // doesn't uncheck the box.
  const [isCustomChecked, setIsCustomChecked] = useState(
    customDiscountPercent > 0,
  );
  // Raw string for the free-form numeric input
  const [rawInput, setRawInput] = useState(
    customDiscountPercent > 0 ? String(customDiscountPercent) : "",
  );
  const [inputError, setInputError] = useState("");

  const handleDiscountInput = (value: string) => {
    // Allow empty, digits, and a single decimal point
    if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;
    setRawInput(value);

    if (value === "") {
      // Input cleared — keep checkbox on but remove active discount
      setInputError("");
      onCustomDiscountChange(0);
      return;
    }
    const num = parseFloat(value);
    if (isNaN(num)) {
      setInputError("Ingresa un número válido");
      return;
    }
    if (num > 10) {
      setInputError("El valor debe estar entre 0 y 10");
      onCustomDiscountChange(0);
      return;
    }
    setInputError("");
    onCustomDiscountChange(num);
  };

  const handleDiscountBlur = () => {
    if (rawInput === "") {
      setInputError("");
      return;
    }
    const num = parseFloat(rawInput);
    if (isNaN(num) || num < 0) {
      setRawInput("");
      onCustomDiscountChange(0);
      setInputError("");
    } else if (num > 10) {
      setInputError("El valor debe estar entre 0 y 10");
      onCustomDiscountChange(0);
    } else {
      // Round to 1 decimal place on blur
      const rounded = Math.round(num * 10) / 10;
      setRawInput(String(rounded));
      onCustomDiscountChange(rounded);
      setInputError("");
    }
  };

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
          {isEvaluating && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
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
            {/* ── Promotion banner ── */}
            {promotionResult?.promotion_message && (
              <div
                className={cn(
                  "mb-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs font-medium",
                  is2x1Active
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20",
                )}
              >
                <Tag className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{promotionResult.promotion_message}</span>
              </div>
            )}

            {/* ── Cart items ── */}
            <div className="flex-1 overflow-y-auto space-y-2 -mx-2 px-2">
              {items.map((item) => {
                const evaluated = evaluatedMap.get(item.product_id);
                const itemDiscount = evaluated?.item_discount ?? 0;
                const promoLabel = evaluated?.promotion_applied;

                return (
                  <div
                    key={item.product_id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.product_name}
                        </p>
                        {promoLabel && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0"
                          >
                            {promoLabel}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.unit_price)} c/u
                        {itemDiscount > 0 && (
                          <span className="ml-1.5 text-emerald-600 font-medium">
                            −{formatCurrency(itemDiscount)}
                          </span>
                        )}
                      </p>
                      {/* Aviso de stock máximo alcanzado */}
                      {item.stock !== undefined &&
                        item.quantity >= item.stock && (
                          <p className="text-[10px] text-amber-500 dark:text-amber-400 flex items-center gap-0.5 mt-0.5">
                            <AlertCircle className="h-2.5 w-2.5 shrink-0" />
                            Stock máximo
                          </p>
                        )}
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
                        disabled={
                          item.stock !== undefined &&
                          item.quantity >= item.stock
                        }
                        title={
                          item.stock !== undefined &&
                          item.quantity >= item.stock
                            ? `Máximo stock: ${item.stock}`
                            : undefined
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(item.subtotal - itemDiscount)}
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
                );
              })}
            </div>

            {/* ── Custom discount section ── */}
            <div className="mt-3">
              {canApplyCustom ? (
                <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="custom-discount-check"
                      checked={isCustomChecked}
                      onCheckedChange={(checked) => {
                        const on = !!checked;
                        setIsCustomChecked(on);
                        if (on) {
                          setRawInput("5");
                          onCustomDiscountChange(5);
                        } else {
                          setRawInput("");
                          onCustomDiscountChange(0);
                          setInputError("");
                        }
                      }}
                    />
                    <Label
                      htmlFor="custom-discount-check"
                      className="text-xs font-medium cursor-pointer"
                    >
                      Aplicar descuento personalizado
                    </Label>
                  </div>

                  {isCustomChecked && is2x1Active && (
                    <div className="flex items-center gap-1.5 pl-6 text-[11px] text-amber-600 dark:text-amber-400">
                      <Info className="h-3 w-3 shrink-0" />
                      <span>El 2x1 será reemplazado por este descuento.</span>
                    </div>
                  )}

                  {isCustomChecked && (
                    <div className="flex flex-col gap-1 pl-6">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Input
                            className={cn(
                              "h-8 w-28 text-xs pr-6",
                              inputError &&
                                "border-destructive focus-visible:ring-destructive",
                            )}
                            inputMode="decimal"
                            placeholder="0 – 10"
                            maxLength={7}
                            value={rawInput}
                            onChange={(e) =>
                              handleDiscountInput(e.target.value)
                            }
                            onBlur={handleDiscountBlur}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                            %
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          de descuento
                        </span>
                      </div>
                      {inputError && (
                        <p className="text-[11px] text-destructive">
                          {inputError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : totals.subtotal > 0 && totals.subtotal < 10_000 ? (
                <p className="text-xs text-muted-foreground px-1">
                  Descuento personalizado disponible en ventas mayores a{" "}
                  {formatCurrency(10_000)}.
                </p>
              ) : null}
            </div>

            {/* ── Totals ── */}
            <div className="border-t border-border pt-3 mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA (13%)</span>
                <span className="text-foreground">
                  {formatCurrency(totals.tax)}
                </span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {is2x1Active
                      ? "Descuento 2x1"
                      : isCustomActive
                        ? `Descuento ${promotionResult?.custom_discount_percent}%`
                        : "Descuento"}
                  </span>
                  <span className="text-emerald-600 font-medium">
                    −{formatCurrency(totals.discount)}
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

            {/* ── Checkout button ── */}
            <Button
              className="w-full mt-4 h-12 text-base font-semibold"
              onClick={onCheckout}
              disabled={isEvaluating}
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calculando...
                </>
              ) : (
                "Proceder al Pago"
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
