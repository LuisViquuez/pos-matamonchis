import { requireAdmin } from "@/app/actions/auth";
import { getAllProducts } from "@/services/products";
import { ProductsManagement } from "@/components/admin/products-management";

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  await requireAdmin();
  const products = await getAllProducts();

  return <ProductsManagement initialProducts={products} />;
}
