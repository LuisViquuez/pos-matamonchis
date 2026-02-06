"use client";

import { useState, useMemo } from "react";
import { ProductGrid } from "./product-grid";
import { CartPanel } from "./cart-panel";
import { CategoryFilter } from "./category-filter";
import { PaymentDialog } from "./payment-dialog";
import { ReceiptDialog } from "./receipt-dialog";
import { createSaleAction, getSaleDetailsAction } from "@/app/actions/sales";
import type { Product } from "@/types/models";
import type { CartItem, SaleWithItems } from "@/types/dto";
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

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(cats).sort()];
  }, [products]);

  // Filter products
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

  // Cart calculations
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * 0.16; // 16% IVA
    const discount = cart.reduce((sum, item) => sum + (item.discount || 0), 0);
    const total = subtotal + tax - discount;
    return { subtotal, tax, discount, total };
  }, [cart]);

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
            : item
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
          : item
      )
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const handlePayment = async (
    paymentMethod: "cash" | "card" | "transfer",
    cashReceived?: number,
    customerName?: string
  ) => {
    setIsProcessing(true);
    try {
      const result = await createSaleAction({
        customer_name: customerName || "Cliente General",
        subtotal: cartTotals.subtotal,
        tax: cartTotals.tax,
        discount: cartTotals.discount,
        total: cartTotals.total,
        payment_method: paymentMethod,
        cash_received: cashReceived,
        change_amount: cashReceived ? cashReceived - cartTotals.total : 0,
        items: cart,
      });

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
          totals={cartTotals}
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
        total={cartTotals.total}
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
