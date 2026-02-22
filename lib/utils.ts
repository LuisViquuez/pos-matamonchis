import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type CurrencyValue = number | string | null | undefined;

interface FormatCurrencyOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export function formatCurrency(
  value: CurrencyValue,
  options: FormatCurrencyOptions = {},
) {
  const { minimumFractionDigits = 2, maximumFractionDigits = 2 } = options;
  const parsedValue = typeof value === "string" ? Number(value) : value;
  const safeValue = Number.isFinite(parsedValue) ? Number(parsedValue) : 0;

  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(safeValue);
}
