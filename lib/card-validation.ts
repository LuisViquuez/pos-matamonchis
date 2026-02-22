/**
 * Card validation utilities for the POS system.
 * All logic is purely computational — no external API calls.
 */

export type CardType = "visa" | "mastercard" | "amex" | "unknown";

/**
 * Luhn algorithm check.
 * Returns true if the card number passes the Luhn checksum.
 */
export function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13) return false;

  let sum = 0;
  let isOdd = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isOdd) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isOdd = !isOdd;
  }
  return sum % 10 === 0;
}

/**
 * Detect card network from the card number prefix.
 */
export function detectCardType(cardNumber: string): CardType {
  const digits = cardNumber.replace(/\D/g, "");
  if (/^4/.test(digits)) return "visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]\d{2}/.test(digits))
    return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  return "unknown";
}

/**
 * Format raw digits as a display-friendly card number.
 *   Amex  : XXXX XXXXXX XXXXX  (4-6-5)
 *   Others: XXXX XXXX XXXX XXXX (4-4-4-4)
 */
export function formatCardNumber(value: string, cardType: CardType): string {
  const digits = value.replace(/\D/g, "");
  if (cardType === "amex") {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)]
      .filter(Boolean)
      .join(" ");
  }
  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(" ");
}

/**
 * Validate expiry date (MM/YY format, not expired).
 */
export function validateExpiry(expiry: string): {
  valid: boolean;
  message?: string;
} {
  const match = expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  if (!match) {
    return { valid: false, message: "Formato inválido (MM/AA)" };
  }
  const month = parseInt(match[1], 10);
  const year = 2000 + parseInt(match[2], 10);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { valid: false, message: "Tarjeta vencida" };
  }
  return { valid: true };
}

/**
 * Expected CVV digit length by card type.
 * American Express uses a 4-digit CID; all others use 3-digit CVV.
 */
export function cvvLength(cardType: CardType): number {
  return cardType === "amex" ? 4 : 3;
}

// ─── Card form data & errors ────────────────────────────────────────────────

export interface CardFormData {
  /** Raw digits only (no spaces). */
  cardNumber: string;
  cardHolder: string;
  /** MM/YY format. */
  expiryDate: string;
  cvv: string;
}

export interface CardFormErrors {
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  cvv?: string;
}

/**
 * Full card form validation.
 * Returns all field-level error messages and an `isValid` flag.
 */
export function validateCardForm(data: CardFormData): {
  errors: CardFormErrors;
  isValid: boolean;
} {
  const errors: CardFormErrors = {};
  const cardType = detectCardType(data.cardNumber);
  const rawDigits = data.cardNumber.replace(/\D/g, "");
  const expectedLength = cardType === "amex" ? 15 : 16;

  // Card number
  if (rawDigits.length < expectedLength) {
    errors.cardNumber = `Número incompleto (${rawDigits.length}/${expectedLength} dígitos)`;
  } else if (!luhnCheck(rawDigits)) {
    errors.cardNumber = "Número de tarjeta inválido";
  }

  // Card holder
  if (!data.cardHolder.trim()) {
    errors.cardHolder = "Ingresa el nombre del titular";
  } else if (data.cardHolder.trim().length < 3) {
    errors.cardHolder = "Nombre demasiado corto";
  }

  // Expiry date
  const expiryResult = validateExpiry(data.expiryDate);
  if (!expiryResult.valid) {
    errors.expiryDate = expiryResult.message;
  }

  // CVV
  const expectedCvv = cvvLength(cardType);
  if (data.cvv.length < expectedCvv) {
    errors.cvv = `CVV debe tener ${expectedCvv} dígitos`;
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}
