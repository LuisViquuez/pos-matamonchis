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
import { Banknote, CreditCard, ArrowRightLeft, Loader2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirm: (
    method: "cash" | "card" | "transfer",
    cashReceived?: number,
    customerName?: string,
  ) => void;
  isProcessing: boolean;
}

const paymentMethods = [
  { id: "cash" as const, label: "Efectivo", icon: Banknote },
  { id: "card" as const, label: "Tarjeta", icon: CreditCard },
  { id: "transfer" as const, label: "Transferencia", icon: ArrowRightLeft },
];

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  onConfirm,
  isProcessing,
}: PaymentDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<
    "cash" | "card" | "transfer"
  >("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [customerName, setCustomerName] = useState("");

  const change =
    selectedMethod === "cash" && cashReceived
      ? Math.max(0, parseFloat(cashReceived) - total)
      : 0;

  const canProceed =
    selectedMethod !== "cash" ||
    (cashReceived && parseFloat(cashReceived) >= total);

  const handleConfirm = () => {
    onConfirm(
      selectedMethod,
      selectedMethod === "cash" ? parseFloat(cashReceived) : undefined,
      customerName || undefined,
    );
  };

  const handleClose = () => {
    if (!isProcessing) {
      setSelectedMethod("cash");
      setCashReceived("");
      setCustomerName("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Procesar Pago</DialogTitle>
          <DialogDescription>
            Total a cobrar:{" "}
            <span className="font-bold text-primary">
              {formatCurrency(total)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Customer name */}
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

          {/* Payment method selection */}
          <div className="space-y-2">
            <Label>Método de Pago</Label>
            <div className="grid grid-cols-3 gap-2">
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

          {/* Cash payment details */}
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
        </div>

        <div className="flex gap-2">
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
            disabled={!canProceed || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              "Confirmar Pago"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
