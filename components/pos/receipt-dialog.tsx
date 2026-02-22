"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Printer, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { SaleWithItems } from "@/types/dto";

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: SaleWithItems | null;
}

const paymentMethodLabels: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
};

export function ReceiptDialog({
  open,
  onOpenChange,
  sale,
}: ReceiptDialogProps) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Venta Completada
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Receipt content */}
          <div className="border border-border rounded-lg p-4 bg-card space-y-4 print:border-0">
            {/* Header */}
            <div className="text-center border-b border-dashed border-border pb-3">
              <h2 className="font-bold text-lg text-foreground">
                LA MATAMONCHIS S.A.
              </h2>
              <p className="text-sm text-muted-foreground">Ticket de Venta</p>
              <p className="text-xs text-muted-foreground mt-1">
                Folio: #{sale.id} |{" "}
                {new Date(sale.created_at!).toLocaleString("es-MX")}
              </p>
            </div>

            {/* Customer */}
            <div className="text-sm">
              <span className="text-muted-foreground">Cliente: </span>
              <span className="text-foreground">
                {sale.customer_name || "Cliente General"}
              </span>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground grid grid-cols-12 pb-1 border-b border-border">
                <span className="col-span-6">Producto</span>
                <span className="col-span-2 text-center">Cant</span>
                <span className="col-span-2 text-right">Precio</span>
                <span className="col-span-2 text-right">Total</span>
              </div>
              {sale.items?.map((item, index) => (
                <div key={index} className="text-sm grid grid-cols-12">
                  <span className="col-span-6 text-foreground truncate">
                    {item.product_name}
                  </span>
                  <span className="col-span-2 text-center text-muted-foreground">
                    {item.quantity}
                  </span>
                  <span className="col-span-2 text-right text-muted-foreground">
                    {formatCurrency(item.unit_price)}
                  </span>
                  <span className="col-span-2 text-right text-foreground">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-dashed border-border pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">
                  {formatCurrency(sale.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA (13%)</span>
                <span className="text-foreground">
                  {formatCurrency(sale.tax)}
                </span>
              </div>
              {Number(sale.discount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Descuento</span>
                  <span className="text-green-600">
                    {formatCurrency(-Number(sale.discount))}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span className="text-foreground">Total</span>
                <span className="text-primary">
                  {formatCurrency(sale.total)}
                </span>
              </div>
            </div>

            {/* Payment info */}
            <div className="border-t border-dashed border-border pt-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método de pago</span>
                <span className="text-foreground">
                  {paymentMethodLabels[sale.payment_method]}
                </span>
              </div>
              {sale.payment_method === "cash" && sale.cash_received && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Efectivo recibido
                    </span>
                    <span className="text-foreground">
                      {formatCurrency(sale.cash_received)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cambio</span>
                    <span className="text-green-600 font-medium">
                      {formatCurrency(sale.change_amount)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="text-center border-t border-dashed border-border pt-3">
              <p className="text-xs text-muted-foreground">
                ¡Gracias por su compra!
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 print:hidden">
          <Button
            variant="outline"
            className="flex-1 bg-transparent"
            onClick={() => onOpenChange(false)}
          >
            <X className="mr-2 h-4 w-4" />
            Cerrar
          </Button>
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
