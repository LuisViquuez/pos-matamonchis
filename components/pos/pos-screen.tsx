"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { ProductGrid } from "./product-grid";
import { CartPanel } from "./cart-panel";
import { CategoryFilter } from "./category-filter";
import { PaymentDialog } from "./payment-dialog";
import { ReceiptDialog } from "./receipt-dialog";
import {
  createSaleAction,
  getSaleDetailsAction,
  evaluatePromotionsAction,
} from "@/app/actions/sales";
import type { Product } from "@/types/models";
import type {
  CartItem,
  SaleWithItems,
  PromotionEvaluationResult,
} from "@/types/dto";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface POSScreenProps {
  initialProducts: Product[];
}

export function POSScreen({ initialProducts }: POSScreenProps) {
  const [products] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState<SaleWithItems | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Promotion state — controlado 100% por el backend
  const [promotionResult, setPromotionResult] =
    useState<PromotionEvaluationResult | null>(null);
  const [customDiscountPercent, setCustomDiscountPercent] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Debounce ref para no saturar el servidor con llamadas
  const evalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // ── Categorías únicas ──
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(cats).sort()];
  }, [products]);

  // ── Productos filtrados ──
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

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
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
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
        },
      ];
    });
  };

  const updateCartItem = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
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
    paymentMethod: "cash" | "card" | "transfer",
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
      }
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)]">
      {/* Products section */}
      <div className="flex-1 flex flex-col min-h-0 order-2 lg:order-1">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        <ProductGrid products={filteredProducts} onAddToCart={addToCart} />
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
