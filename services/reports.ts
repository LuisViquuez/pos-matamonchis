"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import type {
  SalesByPaymentMethod,
  ProductSalesReport,
  SalesByUser,
  DailySalesReport,
} from "@/types/models";

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toNumber" in value) {
    const decimalValue = value as { toNumber: () => number };
    return decimalValue.toNumber();
  }
  return Number(value ?? 0);
}

export async function getSalesByPaymentMethod(
  startDate?: string,
  endDate?: string,
): Promise<SalesByPaymentMethod[]> {
  await requireAdmin();

  if (startDate && endDate) {
    const rows = await prisma.$queryRaw<SalesByPaymentMethod[]>`
      SELECT payment_method, COUNT(*)::int as count, COALESCE(SUM(total),0)::numeric as total
      FROM sales
      WHERE created_at >= ${startDate}::timestamp
      AND created_at <= ${endDate}::timestamp
      GROUP BY payment_method
      ORDER BY total DESC
    `;

    return rows.map((row) => ({
      ...row,
      total: toNumber(row.total),
    }));
  }

  const rows = await prisma.$queryRaw<SalesByPaymentMethod[]>`
    SELECT payment_method, COUNT(*)::int as count, COALESCE(SUM(total),0)::numeric as total
    FROM sales
    GROUP BY payment_method
    ORDER BY total DESC
  `;

  return rows.map((row) => ({
    ...row,
    total: toNumber(row.total),
  }));
}

export async function getProductSalesReport(
  startDate?: string,
  endDate?: string,
): Promise<ProductSalesReport[]> {
  await requireAdmin();
  if (startDate && endDate) {
    const rows = await prisma.$queryRaw<ProductSalesReport[]>`
      SELECT si.product_id, si.product_name, SUM(si.quantity)::int as quantity_sold, COALESCE(SUM(si.subtotal),0)::numeric as total_revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.created_at >= ${startDate}::timestamp
      AND s.created_at <= ${endDate}::timestamp
      GROUP BY si.product_id, si.product_name
      ORDER BY total_revenue DESC
    `;

    return rows.map((row) => ({
      ...row,
      total_revenue: toNumber(row.total_revenue),
    }));
  }

  const rows = await prisma.$queryRaw<ProductSalesReport[]>`
    SELECT si.product_id, si.product_name, SUM(si.quantity)::int as quantity_sold, COALESCE(SUM(si.subtotal),0)::numeric as total_revenue
    FROM sale_items si
    GROUP BY si.product_id, si.product_name
    ORDER BY total_revenue DESC
  `;

  return rows.map((row) => ({
    ...row,
    total_revenue: toNumber(row.total_revenue),
  }));
}

export async function getSalesByUser(
  startDate?: string,
  endDate?: string,
): Promise<SalesByUser[]> {
  await requireAdmin();
  if (startDate && endDate) {
    const rows = await prisma.$queryRaw<SalesByUser[]>`
      SELECT s.user_id, u.name as user_name, COUNT(*)::int as sale_count, COALESCE(SUM(s.total),0)::numeric as total_sales
      FROM sales s
      JOIN users u ON s.user_id = u.id
      WHERE s.created_at >= ${startDate}::timestamp
      AND s.created_at <= ${endDate}::timestamp
      GROUP BY s.user_id, u.name
      ORDER BY total_sales DESC
    `;

    return rows.map((row) => ({
      ...row,
      total_sales: toNumber(row.total_sales),
    }));
  }

  const rows = await prisma.$queryRaw<SalesByUser[]>`
    SELECT s.user_id, u.name as user_name, COUNT(*)::int as sale_count, COALESCE(SUM(s.total),0)::numeric as total_sales
    FROM sales s
    JOIN users u ON s.user_id = u.id
    GROUP BY s.user_id, u.name
    ORDER BY total_sales DESC
  `;

  return rows.map((row) => ({
    ...row,
    total_sales: toNumber(row.total_sales),
  }));
}

export async function getDailySalesReport(
  startDate?: string,
  endDate?: string,
): Promise<DailySalesReport[]> {
  await requireAdmin();
  if (startDate && endDate) {
    const rows = await prisma.$queryRaw<DailySalesReport[]>`
      SELECT DATE(created_at)::text as date, COUNT(*)::int as count, COALESCE(SUM(total),0)::numeric as total
      FROM sales
      WHERE created_at >= ${startDate}::timestamp
      AND created_at <= ${endDate}::timestamp
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    return rows.map((row) => ({
      ...row,
      total: toNumber(row.total),
    }));
  }

  const rows = await prisma.$queryRaw<DailySalesReport[]>`
    SELECT DATE(created_at)::text as date, COUNT(*)::int as count, COALESCE(SUM(total),0)::numeric as total
    FROM sales
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `;

  return rows.map((row) => ({
    ...row,
    total: toNumber(row.total),
  }));
}

export async function getTotalSalesStats(
  startDate?: string,
  endDate?: string,
): Promise<{
  totalSales: number;
  totalRevenue: number;
  avgTicket: number;
  totalProducts: number;
}> {
  await requireAdmin();
  if (startDate && endDate) {
    const salesStats = (
      await prisma.$queryRaw<
        { total_sales: number; total_revenue: string; avg_ticket: string }[]
      >`
      SELECT COUNT(*)::int as total_sales, COALESCE(SUM(total),0)::numeric as total_revenue, COALESCE(AVG(total),0)::numeric as avg_ticket
      FROM sales
      WHERE created_at >= ${startDate}::timestamp
      AND created_at <= ${endDate}::timestamp
    `
    )[0];

    const productsStats = (
      await prisma.$queryRaw<{ total_products: number }[]>`
      SELECT COALESCE(SUM(si.quantity),0)::int as total_products
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.created_at >= ${startDate}::timestamp
      AND s.created_at <= ${endDate}::timestamp
    `
    )[0];

    return {
      totalSales: salesStats.total_sales,
      totalRevenue: Number(salesStats.total_revenue),
      avgTicket: Number(salesStats.avg_ticket),
      totalProducts: productsStats.total_products,
    };
  }

  const salesStats = (
    await prisma.$queryRaw<
      { total_sales: number; total_revenue: string; avg_ticket: string }[]
    >`
    SELECT COUNT(*)::int as total_sales, COALESCE(SUM(total),0)::numeric as total_revenue, COALESCE(AVG(total),0)::numeric as avg_ticket
    FROM sales
  `
  )[0];

  const productsStats = (
    await prisma.$queryRaw<{ total_products: number }[]>`
    SELECT COALESCE(SUM(quantity),0)::int as total_products
    FROM sale_items
  `
  )[0];

  return {
    totalSales: salesStats.total_sales,
    totalRevenue: Number(salesStats.total_revenue),
    avgTicket: Number(salesStats.avg_ticket),
    totalProducts: productsStats.total_products,
  };
}

// Additional report functions
export async function getTodaySummary(): Promise<{
  totalSales: number;
  totalRevenue: number;
  avgTicket: number;
  totalProducts: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getTotalSalesStats(today.toISOString(), tomorrow.toISOString());
}

export async function getRecentSales(limit = 10): Promise<
  {
    id: number;
    customer_name: string | null;
    total: number;
    payment_method: string;
    created_at: string;
    user_name: string;
  }[]
> {
  const sales = await prisma.$queryRaw<
    {
      id: number;
      customer_name: string | null;
      total: number;
      payment_method: string;
      created_at: string;
      user_name: string;
    }[]
  >`
    SELECT s.id, s.customer_name, s.total::float8 as total, s.payment_method, s.created_at::text as created_at, u.name as user_name
    FROM sales s
    LEFT JOIN users u ON s.user_id = u.id
    ORDER BY s.created_at DESC
    LIMIT ${limit}
  `;
  return sales;
}

export async function getSalesReport(
  startDate?: string,
  endDate?: string,
): Promise<{
  totalSales: number;
  totalRevenue: number;
  avgTicket: number;
  totalProducts: number;
  salesByPaymentMethod: SalesByPaymentMethod[];
  dailySales: DailySalesReport[];
}> {
  const [stats, paymentMethods, dailySales] = await Promise.all([
    getTotalSalesStats(startDate, endDate),
    getSalesByPaymentMethod(startDate, endDate),
    getDailySalesReport(startDate, endDate),
  ]);

  return {
    ...stats,
    salesByPaymentMethod: paymentMethods,
    dailySales,
  };
}

export async function getTopProducts(
  limit = 10,
  startDate?: string,
  endDate?: string,
): Promise<ProductSalesReport[]> {
  await requireAdmin();

  if (startDate && endDate) {
    const rows = await prisma.$queryRaw<ProductSalesReport[]>`
      SELECT 
        si.product_id,
        si.product_name,
        SUM(si.quantity)::int as quantity_sold,
        COALESCE(SUM(si.subtotal), 0)::numeric as total_revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.created_at >= ${startDate}::timestamp
      AND s.created_at <= ${endDate}::timestamp
      GROUP BY si.product_id, si.product_name
      ORDER BY total_revenue DESC
      LIMIT ${limit}
    `;

    return rows.map((row) => ({
      ...row,
      total_revenue: toNumber(row.total_revenue),
    }));
  }

  const rows = await prisma.$queryRaw<ProductSalesReport[]>`
      SELECT 
        si.product_id,
        si.product_name,
        SUM(si.quantity)::int as quantity_sold,
        COALESCE(SUM(si.subtotal), 0)::numeric as total_revenue
      FROM sale_items si
      GROUP BY si.product_id, si.product_name
      ORDER BY total_revenue DESC
      LIMIT ${limit}
    `;

  return rows.map((row) => ({
    ...row,
    total_revenue: toNumber(row.total_revenue),
  }));
}

export async function getSalesByHour(
  startDate?: string,
  endDate?: string,
): Promise<
  {
    hour: number;
    count: number;
    total: number;
  }[]
> {
  await requireAdmin();

  if (startDate && endDate) {
    const rows = await prisma.$queryRaw<
      { hour: number; count: number; total: number }[]
    >`
      SELECT 
        EXTRACT(HOUR FROM created_at)::int as hour,
        COUNT(*)::int as count,
        COALESCE(SUM(total), 0)::numeric as total
      FROM sales
      WHERE created_at >= ${startDate}::timestamp
      AND created_at <= ${endDate}::timestamp
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `;

    return rows.map((row) => ({
      ...row,
      total: toNumber(row.total),
    }));
  }

  const rows = await prisma.$queryRaw<
    { hour: number; count: number; total: number }[]
  >`
      SELECT 
        EXTRACT(HOUR FROM created_at)::int as hour,
        COUNT(*)::int as count,
        COALESCE(SUM(total), 0)::numeric as total
      FROM sales
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `;

  return rows.map((row) => ({
    ...row,
    total: toNumber(row.total),
  }));
}
