import { getActiveProducts } from "@/services/products";
import { POSScreen } from "@/components/pos/pos-screen";

export const dynamic = 'force-dynamic';

export default async function POSPage() {
  const products = await getActiveProducts();

  return <POSScreen initialProducts={products} />;
}
