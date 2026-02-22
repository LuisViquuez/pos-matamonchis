/**
 * PromotionEngine — lógica de negocio de promociones (BACKEND ONLY)
 *
 * Reglas:
 *  - 2x1 en Gelatinas: por cada 2 unidades se cobra 1.
 *  - Descuento personalizado (0.5 – 10 %, pasos de 0.5)
 *    disponible si subtotal >= 10 000 y NO hay 2x1 activo.
 *  - Nunca se aplican dos promociones al mismo tiempo.
 */

import prisma from "./prisma";

// ──────────────────────────────────────────────
// Input / Output types
// ──────────────────────────────────────────────

export interface EvaluationItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface EvaluatedItem extends EvaluationItem {
  /** Precio bruto del ítem (qty * unitPrice), antes de descuentos */
  subtotal: number;
  /** Monto descontado aplicado a este ítem */
  item_discount: number;
  /** Nombre de la promoción aplicada a este ítem (null si ninguna) */
  promotion_applied: string | null;
}

export interface PromotionEvaluationResult {
  items: EvaluatedItem[];

  /** Suma bruta de todos los ítems */
  subtotal: number;

  /** Descuento proveniente del 2x1 */
  promotion_discount: number;

  /** Descuento proveniente del porcentaje personalizado */
  custom_discount: number;

  /** Suma de todos los descuentos */
  total_discount: number;

  /** IVA calculado sobre el subtotal bruto */
  tax: number;

  /** Total final = subtotal + tax - total_discount */
  total: number;

  /** Qué promoción está activa right now */
  active_promotion: "2x1" | "custom" | null;

  /** Mensaje listo para mostrar al usuario */
  promotion_message: string | null;

  /** Flag: el frontend puede mostrar el checkbox de descuento personalizado */
  can_apply_custom_discount: boolean;

  /** Porcentaje efectivamente aplicado (0 si ninguno) */
  custom_discount_percent: number;
}

// ──────────────────────────────────────────────
// Main evaluator
// ──────────────────────────────────────────────

/**
 * Evalúa todas las promociones para el carrito dado.
 *
 * @param items                 Ítems del carrito (product_id, qty, unit_price)
 * @param customDiscountPercent Porcentaje de descuento personalizado (0–10)
 */
export async function evaluatePromotions(
  items: EvaluationItem[],
  customDiscountPercent = 0,
): Promise<PromotionEvaluationResult> {
  if (items.length === 0) {
    return emptyResult();
  }

  // 1. Carga en base de datos las promociones activas de los productos del carrito
  const productIds = items.map((i) => i.product_id);

  const productPromotions = await prisma.productPromotion.findMany({
    where: { productId: { in: productIds } },
    include: { promotion: true },
  });

  // Map: productId → lista de promociones activas
  const promoMap = new Map<
    number,
    (typeof productPromotions)[0]["promotion"][]
  >();
  for (const pp of productPromotions) {
    if (pp.promotion.isActive) {
      if (!promoMap.has(pp.productId)) promoMap.set(pp.productId, []);
      promoMap.get(pp.productId)!.push(pp.promotion);
    }
  }

  // 2. Evalúa el 2x1 ítem por ítem
  let promotionDiscount = 0;
  let has2x1 = false;
  const evaluatedItems: EvaluatedItem[] = [];

  for (const item of items) {
    const promos = promoMap.get(item.product_id) ?? [];
    const promo2x1 = promos.find(
      (p) =>
        p.type === "2x1" && p.isActive && item.quantity >= (p.minQuantity ?? 2),
    );

    let itemDiscount = 0;
    let promotionApplied: string | null = null;

    if (promo2x1) {
      has2x1 = true;
      // Por cada par de unidades, 1 es gratis
      const freeUnits = Math.floor(item.quantity / 2);
      itemDiscount = freeUnits * item.unit_price;
      promotionApplied = promo2x1.name ?? "Gelatina 2x1";
    }

    promotionDiscount += itemDiscount;
    evaluatedItems.push({
      ...item,
      subtotal: item.quantity * item.unit_price,
      item_discount: itemDiscount,
      promotion_applied: promotionApplied,
    });
  }

  const rawSubtotal = evaluatedItems.reduce((s, i) => s + i.subtotal, 0);

  // 3. Exclusividad — el descuento personalizado tiene prioridad sobre el 2x1
  //    cuando el usuario lo activa explícitamente.
  //    canApplyCustomDiscount está disponible si subtotal >= 10 000,
  //    independientemente de si hay 2x1.
  const canApplyCustomDiscount = rawSubtotal >= 10_000;

  const wantCustom = customDiscountPercent > 0 && canApplyCustomDiscount;

  let effectiveCustomPercent = 0;
  let customDiscount = 0;
  let activePromotion: "2x1" | "custom" | null = null;
  let promotionMessage: string | null = null;

  if (wantCustom) {
    // Descuento personalizado invalida el 2x1 — zerear descuentos por ítem
    for (const ei of evaluatedItems) {
      ei.item_discount = 0;
      ei.promotion_applied = null;
    }
    promotionDiscount = 0;
    const clamped = Math.min(Math.max(customDiscountPercent, 0), 10);
    effectiveCustomPercent = Math.round(clamped * 10) / 10;
    customDiscount = Math.round(rawSubtotal * (effectiveCustomPercent / 100));
    activePromotion = "custom";
    promotionMessage =
      `Descuento del ${effectiveCustomPercent}% aplicado` +
      ` — ahorrás ₡${customDiscount.toLocaleString("es-CR")}`;
  } else if (has2x1) {
    activePromotion = "2x1";
    promotionMessage =
      `Promoción 2x1 aplicada en Gelatinas` +
      ` — ahorrás ₡${promotionDiscount.toLocaleString("es-CR")}`;
  }

  const totalDiscount = promotionDiscount + customDiscount;
  const tax = Math.round(rawSubtotal * 0.13);
  const total = Math.max(0, rawSubtotal + tax - totalDiscount);

  return {
    items: evaluatedItems,
    subtotal: rawSubtotal,
    promotion_discount: promotionDiscount,
    custom_discount: customDiscount,
    total_discount: totalDiscount,
    tax,
    total,
    active_promotion: activePromotion,
    promotion_message: promotionMessage,
    can_apply_custom_discount: canApplyCustomDiscount,
    custom_discount_percent: effectiveCustomPercent,
  };
}

// ──────────────────────────────────────────────
// Helper
// ──────────────────────────────────────────────

function emptyResult(): PromotionEvaluationResult {
  return {
    items: [],
    subtotal: 0,
    promotion_discount: 0,
    custom_discount: 0,
    total_discount: 0,
    tax: 0,
    total: 0,
    active_promotion: null,
    promotion_message: null,
    can_apply_custom_discount: false,
    custom_discount_percent: 0,
  };
}
