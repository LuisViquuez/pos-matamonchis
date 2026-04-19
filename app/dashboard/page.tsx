import { requireAuth } from "@/app/actions/auth";
import { getTodaySummary, getRecentSales } from "@/services/reports";
import { DashboardStats } from "@/components/dashboard/stats";
import { RecentSalesTable } from "@/components/dashboard/recent-sales";
import { QuickActions } from "@/components/dashboard/quick-actions";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await requireAuth();
  const [summary, recentSales] = await Promise.all([
    getTodaySummary(),
    getRecentSales(5),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Bienvenido, {user.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Resumen del día - {new Date().toLocaleDateString("es-MX", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <DashboardStats summary={summary} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentSalesTable sales={recentSales} />
        </div>
        <div>
          <QuickActions isAdmin={user.role === "admin"} />
        </div>
      </div>
    </div>
  );
}
