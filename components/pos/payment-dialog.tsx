"use client";

import { useState, useRef } from "react";
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
import {
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Loader2,
  AlertCircle,
  Smartphone,
  ShieldCheck,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import {
  detectCardType,
  formatCardNumber,
  validateCardForm,
  cvvLength,
  type CardType,
  type CardFormErrors,
} from "@/lib/card-validation";

// ─── Card network display helpers ────────────────────────────────────────────

const CARD_NETWORK_LABEL: Record<CardType, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  unknown: "",
};

const CARD_NETWORK_ICON: Record<CardType, string> = {
  visa: "💳",
  mastercard: "🔴",
  amex: "⚡",
  unknown: "💳",
};

// ─── Props ────────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  onConfirm,
  isProcessing,
}: PaymentDialogProps) {
  // ── Common state ──────────────────────────────────────────────────────────
  const [selectedMethod, setSelectedMethod] = useState<
    "cash" | "card" | "transfer"
  >("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [customerName, setCustomerName] = useState("");

  // ── Card form state ───────────────────────────────────────────────────────
  const [cardNumberFormatted, setCardNumberFormatted] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardErrors, setCardErrors] = useState<CardFormErrors>({});
  /** Whether the user has already attempted to submit (activates inline errors). */
  const [showCardErrors, setShowCardErrors] = useState(false);
  /** True while the simulated card-processing delay is running. */
  const [isSimulating, setIsSimulating] = useState(false);
  const simulateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived card values ───────────────────────────────────────────────────
  const rawCardNumber = cardNumberFormatted.replace(/\D/g, "");
  const cardType = detectCardType(rawCardNumber);
  const expectedCvvLen = cvvLength(cardType);

  // ── Card input handlers ───────────────────────────────────────────────────

  const handleCardNumberChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    // Amex max 15 digits, others max 16
    const maxLen = detectCardType(digits) === "amex" ? 15 : 16;
    const trimmed = digits.slice(0, maxLen);
    setCardNumberFormatted(formatCardNumber(trimmed, detectCardType(trimmed)));
    if (showCardErrors) revalidateCard({ cardNumber: trimmed });
  };

  const handleExpiryChange = (value: string) => {
    // Accept only digits, auto-insert "/" after the 2nd digit
    const digits = value.replace(/\D/g, "").slice(0, 4);
    const formatted =
      digits.length >= 3
        ? digits.slice(0, 2) + "/" + digits.slice(2)
        : digits.length === 2 && expiryDate.length < 3
          ? digits + "/"
          : digits;
    setExpiryDate(formatted);
    if (showCardErrors) revalidateCard({ expiryDate: formatted });
  };

  const handleCvvChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, expectedCvvLen);
    setCvv(digits);
    if (showCardErrors) revalidateCard({ cvv: digits });
  };

  const handleCardHolderChange = (value: string) => {
    // Only letters, spaces, and common accented characters
    const cleaned = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]/g, "");
    setCardHolder(cleaned.toUpperCase());
    if (showCardErrors) revalidateCard({ cardHolder: cleaned });
  };

  /** Re-run validation with optional field overrides and update error state. */
  const revalidateCard = (
    overrides: Partial<{
      cardNumber: string;
      cardHolder: string;
      expiryDate: string;
      cvv: string;
    }> = {},
  ): boolean => {
    const { errors, isValid } = validateCardForm({
      cardNumber: overrides.cardNumber ?? rawCardNumber,
      cardHolder: overrides.cardHolder ?? cardHolder,
      expiryDate: overrides.expiryDate ?? expiryDate,
      cvv: overrides.cvv ?? cvv,
    });
    setCardErrors(errors);
    return isValid;
  };

  // ── Payment handlers ──────────────────────────────────────────────────────

  const change =
    selectedMethod === "cash" && cashReceived
      ? Math.max(0, parseFloat(cashReceived) - total)
      : 0;

  const isCashReady =
    selectedMethod === "cash" &&
    !!cashReceived &&
    parseFloat(cashReceived) >= total;

  const handleConfirm = () => {
    if (selectedMethod === "card") {
      // Show all errors on first submit attempt
      setShowCardErrors(true);
      const isValid = revalidateCard();
      if (!isValid) return;

      // Simulate card processing delay before calling parent
      setIsSimulating(true);
      simulateTimerRef.current = setTimeout(() => {
        setIsSimulating(false);
        onConfirm("card", undefined, customerName || undefined);
      }, 1800);
      return;
    }

    onConfirm(
      selectedMethod,
      selectedMethod === "cash" ? parseFloat(cashReceived) : undefined,
      customerName || undefined,
    );
  };

  const handleClose = () => {
    if (!isProcessing && !isSimulating) {
      if (simulateTimerRef.current) clearTimeout(simulateTimerRef.current);
      resetForm();
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setSelectedMethod("cash");
    setCashReceived("");
    setCustomerName("");
    setCardNumberFormatted("");
    setCardHolder("");
    setExpiryDate("");
    setCvv("");
    setCardErrors({});
    setShowCardErrors(false);
    setIsSimulating(false);
  };

  // True while either the simulated delay or the real backend call is running
  const isBusy = isProcessing || isSimulating;

  // Button label per method
  const buttonLabel =
    selectedMethod === "card"
      ? "Cobrar"
      : selectedMethod === "transfer"
        ? "Confirmar"
        : "Confirmar Pago";

  const isSubmitDisabled =
    isBusy || (selectedMethod === "cash" && !isCashReady);

  // ── Render ────────────────────────────────────────────────────────────────

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
              disabled={isBusy}
            />
          </div>

          {/* ── Payment method selector ── */}
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
                    disabled={isBusy}
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
                  disabled={isBusy}
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
              CARD — full simulated card form
          ═══════════════════════════════════════════════ */}
          {selectedMethod === "card" && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/50">
              {/* Card network badge */}
              {rawCardNumber.length >= 1 && cardType !== "unknown" && (
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs text-muted-foreground">
                    Red detectada
                  </span>
                  <span className="text-xs font-semibold flex items-center gap-1">
                    {CARD_NETWORK_ICON[cardType]} {CARD_NETWORK_LABEL[cardType]}
                  </span>
                </div>
              )}

              {/* Card number */}
              <div className="space-y-1">
                <Label htmlFor="cardNumber">Número de Tarjeta</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder={
                      cardType === "amex"
                        ? "0000 000000 00000"
                        : "0000 0000 0000 0000"
                    }
                    value={cardNumberFormatted}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                    disabled={isBusy}
                    className={cn(
                      "font-mono tracking-wider",
                      showCardErrors &&
                        cardErrors.cardNumber &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                  {cardType !== "unknown" && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base pointer-events-none">
                      {CARD_NETWORK_ICON[cardType]}
                    </span>
                  )}
                </div>
                {showCardErrors && cardErrors.cardNumber && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {cardErrors.cardNumber}
                  </p>
                )}
              </div>

              {/* Card holder */}
              <div className="space-y-1">
                <Label htmlFor="cardHolder">Nombre del Titular</Label>
                <Input
                  id="cardHolder"
                  autoComplete="cc-name"
                  placeholder="NOMBRE APELLIDO"
                  value={cardHolder}
                  onChange={(e) => handleCardHolderChange(e.target.value)}
                  disabled={isBusy}
                  className={cn(
                    "font-mono uppercase tracking-wide",
                    showCardErrors &&
                      cardErrors.cardHolder &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                />
                {showCardErrors && cardErrors.cardHolder && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {cardErrors.cardHolder}
                  </p>
                )}
              </div>

              {/* Expiry + CVV in two columns */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="expiryDate">Vencimiento</Label>
                  <Input
                    id="expiryDate"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/AA"
                    value={expiryDate}
                    onChange={(e) => handleExpiryChange(e.target.value)}
                    disabled={isBusy}
                    maxLength={5}
                    className={cn(
                      "font-mono",
                      showCardErrors &&
                        cardErrors.expiryDate &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                  {showCardErrors && cardErrors.expiryDate && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {cardErrors.expiryDate}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cvv">
                    CVV{" "}
                    <span className="text-muted-foreground font-normal">
                      ({expectedCvvLen} dígitos)
                    </span>
                  </Label>
                  <Input
                    id="cvv"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    type="password"
                    placeholder={cardType === "amex" ? "0000" : "000"}
                    value={cvv}
                    onChange={(e) => handleCvvChange(e.target.value)}
                    disabled={isBusy}
                    maxLength={expectedCvvLen}
                    className={cn(
                      "font-mono",
                      showCardErrors &&
                        cardErrors.cvv &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                  {showCardErrors && cardErrors.cvv && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {cardErrors.cvv}
                    </p>
                  )}
                </div>
              </div>

              {/* Simulation / processing feedback */}
              {isSimulating && (
                <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  <span>Procesando pago con tarjeta…</span>
                </div>
              )}

              {/* Security notice */}
              {!isSimulating && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Simulación de pago — ningún dato se transmite externamente
                </p>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              TRANSFER — SINPE Móvil info + confirm
          ═══════════════════════════════════════════════ */}
          {selectedMethod === "transfer" && (
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
            disabled={isBusy}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={isSubmitDisabled}
          >
            {isBusy ? (
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
