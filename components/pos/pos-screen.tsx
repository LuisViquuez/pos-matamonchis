"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
import { ProductGrid } from "./product-grid";
import { CartPanel } from "./cart-panel";
import { PaymentDialog } from "./payment-dialog";
import { ReceiptDialog } from "./receipt-dialog";
import {
  createSaleAction,
  getSaleDetailsAction,
  evaluatePromotionsAction,
} from "@/app/actions/sales";
import { getActiveProductsListAction } from "@/app/actions/products";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Product } from "@/types/models";
import type {
  CartItem,
  SaleWithItems,
  PromotionEvaluationResult,
} from "@/types/dto";

interface POSScreenProps {
  initialProducts: Product[];
}

export function POSScreen({ initialProducts }: POSScreenProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState<SaleWithItems | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCartCollapsed, setIsCartCollapsed] = useState(false);
  const isMobile = useIsMobile();

  // Promotion state — controlado 100% por el backend
  const [promotionResult, setPromotionResult] =
    useState<PromotionEvaluationResult | null>(null);
  const [customDiscountPercent, setCustomDiscountPercent] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Debounce ref para no saturar el servidor con llamadas
  const evalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    if (isMobile) {
      setIsCartCollapsed(true);
    }
  }, [isMobile]);

  useEffect(() => {
    let cancelled = false;

    const syncLatestProducts = async () => {
      const latestProducts = await getActiveProductsListAction();
      if (!cancelled) {
        setProducts(latestProducts);
      }
    };

    syncLatestProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Evaluar promociones en el servidor cada vez que el carrito o el descuento cambian ──
  useEffect(() => {
    if (cart.length === 0) {
      setPromotionResult(null);
      setCustomDiscountPercent(0);
      return;
    }

    setIsEvaluating(true);
    if (evalTimer.current) clearTimeout(evalTimer.current);

    evalTimer.current = setTimeout(async () => {
      const items = cart.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      const response = await evaluatePromotionsAction(
        items,
        customDiscountPercent,
      );

      if (response.success && response.result) {
        setPromotionResult(response.result);

        // Si el backend detectó 2x1, anular cualquier descuento personalizado activo
        if (
          response.result.active_promotion === "2x1" &&
          customDiscountPercent > 0
        ) {
          setCustomDiscountPercent(0);
        }
      }
      setIsEvaluating(false);
    }, 300);

    return () => {
      if (evalTimer.current) clearTimeout(evalTimer.current);
    };
  }, [cart, customDiscountPercent]);

  // ── Totales: siempre preferir el resultado del backend ──
  const displayTotals = useMemo(() => {
    if (promotionResult) {
      return {
        subtotal: promotionResult.subtotal,
        tax: promotionResult.tax,
        discount: promotionResult.total_discount,
        total: promotionResult.total,
      };
    }
    // Optimistic mientras se evalúa
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = Math.round(subtotal * 0.13);
    return { subtotal, tax, discount: 0, total: subtotal + tax };
  }, [promotionResult, cart]);

  // ── Acciones del carrito ──
  const addToCart = (product: Product) => {
    // Validación de stock: verificar unidades ya en carrito vs. stock disponible
    const existing = cart.find((item) => item.product_id === product.id);
    const currentQty = existing?.quantity ?? 0;

    if (product.stock === 0) {
      toast.error(`"${product.name}" está agotado`);
      return;
    }
    if (currentQty >= product.stock) {
      toast.error(
        `Stock insuficiente para "${product.name}". Máximo: ${product.stock} unidad(es)`,
      );
      return;
    }

    setCart((prev) => {
      const existingItem = prev.find((item) => item.product_id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unit_price,
              }
            : item,
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: Number(product.price),
          subtotal: Number(product.price),
          stock: product.stock,
        },
      ];
    });
  };

  const updateCartItem = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    // Validar que la nueva cantidad no supere el stock disponible
    const item = cart.find((i) => i.product_id === productId);
    if (item && quantity > item.stock) {
      toast.error(
        `Solo hay ${item.stock} unidad(es) disponible(s) de "${item.product_name}"`,
      );
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, quantity, subtotal: quantity * item.unit_price }
          : item,
      ),
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setPromotionResult(null);
    setCustomDiscountPercent(0);
  };

  // ── Pago: envía customDiscountPercent al backend para re-validación ──
  const handlePayment = async (
    paymentMethod: "cash" | "sinpe",
    cashReceived?: number,
    customerName?: string,
  ) => {
    setIsProcessing(true);
    try {
      const result = await createSaleAction(
        {
          customer_name: customerName || "Cliente General",
          // El backend recalcula estos, pero se envían como referencia
          subtotal: displayTotals.subtotal,
          tax: displayTotals.tax,
          discount: displayTotals.discount,
          total: displayTotals.total,
          payment_method: paymentMethod,
          cash_received: cashReceived,
          change_amount: cashReceived ? cashReceived - displayTotals.total : 0,
          items: cart,
        },
        customDiscountPercent,
      );

      if (result.success && result.saleId) {
        const saleDetails = await getSaleDetailsAction(result.saleId);
        setLastSale(saleDetails);
        setIsPaymentOpen(false);
        setIsReceiptOpen(true);
        clearCart();
      } else {
        // Mostrar error específico del backend (ej. stock insuficiente)
        toast.error(result.error ?? "Error al procesar la venta");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Ocurrió un error inesperado al procesar la venta");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)]">
      {/* Products section */}
      <div className="flex-1 flex flex-col min-h-0 order-2 lg:order-1">
        <ProductGrid products={products} onAddToCart={addToCart} />
      </div>

      {/* Cart section */}
      <div className="w-full lg:w-96 order-1 lg:order-2">
        <CartPanel
          items={cart}
          totals={displayTotals}
          promotionResult={promotionResult}
          isEvaluating={isEvaluating}
          customDiscountPercent={customDiscountPercent}
          onCustomDiscountChange={setCustomDiscountPercent}
          onUpdateQuantity={updateCartItem}
          onRemove={removeFromCart}
          onClear={clearCart}
          onCheckout={() => setIsPaymentOpen(true)}
          isCollapsed={isCartCollapsed}
          onToggleCollapse={() => setIsCartCollapsed((current) => !current)}
        />
      </div>

      {/* Payment dialog */}
      <PaymentDialog
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        total={displayTotals.total}
        onConfirm={handlePayment}
        isProcessing={isProcessing}
      />

      {/* Receipt dialog */}
      <ReceiptDialog
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        sale={lastSale}
      />
    </div>
  );
}
