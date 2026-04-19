"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banknote, Smartphone, Loader2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirm: (
    method: "cash" | "sinpe",
    cashReceived?: number,
    customerName?: string,
  ) => void;
  isProcessing: boolean;
}

const paymentMethods = [
  { id: "cash" as const, label: "Efectivo", icon: Banknote },
  { id: "sinpe" as const, label: "SINPE", icon: Smartphone },
];

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  onConfirm,
  isProcessing,
}: PaymentDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<"cash" | "sinpe">(
    "cash",
  );
  const [cashReceived, setCashReceived] = useState("");
  const [customerName, setCustomerName] = useState("");

  const change =
    selectedMethod === "cash" && cashReceived
      ? Math.max(0, parseFloat(cashReceived) - total)
      : 0;

  const isCashReady =
    selectedMethod === "cash" &&
    !!cashReceived &&
    parseFloat(cashReceived) >= total;

  const handleConfirm = () => {
    onConfirm(
      selectedMethod,
      selectedMethod === "cash" ? parseFloat(cashReceived) : undefined,
      customerName || undefined,
    );
  };

  const handleClose = () => {
    if (!isProcessing) {
      resetForm();
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setSelectedMethod("cash");
    setCashReceived("");
    setCustomerName("");
  };

  // Button label per method
  const buttonLabel =
    selectedMethod === "sinpe" ? "Confirmar" : "Confirmar Pago";

  const isSubmitDisabled =
    isProcessing || (selectedMethod === "cash" && !isCashReady);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Procesar Pago</DialogTitle>
          <DialogDescription>
            Total a cobrar:{" "}
            <span className="font-bold text-primary">
              {formatCurrency(total)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* ── Customer name ── */}
          <div className="space-y-2">
            <Label htmlFor="customerName">Nombre del Cliente (opcional)</Label>
            <Input
              id="customerName"
              placeholder="Cliente General"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          {/* ── Payment method selector ── */}
          <div className="space-y-2">
            <Label>Método de Pago</Label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <Button
                    key={method.id}
                    variant="outline"
                    className={cn(
                      "h-20 flex-col gap-2",
                      selectedMethod === method.id &&
                        "border-primary bg-primary/5 text-primary",
                    )}
                    onClick={() => setSelectedMethod(method.id)}
                    disabled={isProcessing}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-medium">{method.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════
              CASH — amount received + change
          ═══════════════════════════════════════════════ */}
          {selectedMethod === "cash" && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="cashReceived">Efectivo Recibido</Label>
                <Input
                  id="cashReceived"
                  type="number"
                  placeholder="0.00"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  disabled={isProcessing}
                  className="text-lg font-mono"
                />
              </div>
              {cashReceived && (
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">Cambio</span>
                  <span
                    className={cn(
                      "text-xl font-bold",
                      change >= 0 ? "text-green-600" : "text-destructive",
                    )}
                  >
                    {formatCurrency(change)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              SINPE Móvil info + confirm
          ═══════════════════════════════════════════════ */}
          {selectedMethod === "sinpe" && (
            <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border">
              {/* Header */}
              <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                <Smartphone className="h-4 w-4 text-primary" />
                Datos para SINPE Móvil
              </div>

              {/* SINPE details */}
              <div className="space-y-0 divide-y divide-border/60">
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-muted-foreground">Número</span>
                  <span className="text-xl font-bold font-mono tracking-[0.15em] text-foreground select-all">
                    8734&nbsp;4334
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-muted-foreground">Titular</span>
                  <span className="text-sm font-semibold text-foreground">
                    LA MATAMONCHIS S.A.
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-muted-foreground">Monto</span>
                  <span className="text-sm font-bold text-primary">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Realiza el SINPE Móvil por el monto exacto y luego presiona{" "}
                <strong>Confirmar</strong> para registrar el pago.
              </p>
            </div>
          )}
        </div>

        {/* ── Action buttons ── */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1 bg-transparent"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={isSubmitDisabled}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando…
              </>
            ) : (
              buttonLabel
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
