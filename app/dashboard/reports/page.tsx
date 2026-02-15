import { requireAuth } from "@/app/actions/auth";
import {
  getSalesReport,
  getTopProducts,
  getSalesByPaymentMethod,
  getSalesByHour,
} from "@/services/reports";
import { ReportsHeader } from "@/components/reports/reports-header";
import { SalesChart } from "@/components/reports/sales-chart";
import { TopProductsTable } from "@/components/reports/top-products-table";
import { PaymentMethodChart } from "@/components/reports/payment-method-chart";
import { HourlySalesChart } from "@/components/reports/hourly-sales-chart";

export const dynamic = 'force-dynamic';

interface ReportsPageProps {
  searchParams: Promise<{ period?: string; startDate?: string; endDate?: string }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  await requireAuth();
  
  
  const params = await searchParams;
  const period = params.period || "today";
  
  // Calculate date range based on period
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;
  
  switch (period) {
    case "week":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "custom":
      startDate = params.startDate ? new Date(params.startDate) : new Date(now.setDate(now.getDate() - 7));
      endDate = params.endDate ? new Date(params.endDate) : new Date();
      break;
    default: // today
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
  }

  const [salesReport, topProducts, paymentMethods, hourlySales] = await Promise.all([
    getSalesReport(startDate, endDate),
    getTopProducts(10, startDate, endDate),
    getSalesByPaymentMethod(startDate, endDate),
    getSalesByHour(startDate, endDate),
  ]);

  return (
    <div className="space-y-6">
      <ReportsHeader
        period={period}
        startDate={startDate}
        endDate={endDate}
        summary={salesReport}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SalesChart data={hourlySales} />
        <PaymentMethodChart data={paymentMethods} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopProductsTable products={topProducts} />
        <HourlySalesChart data={hourlySales} />
      </div>
    </div>
  );
}
