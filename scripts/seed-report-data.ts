import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString = (process.env.DATABASE_URL ?? "").replace(
  /sslmode=(prefer|require|verify-ca)/,
  "sslmode=verify-full",
);

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const productNames = [
  "Papas Fritas",
  "Papas Naturales",
  "Bolis de Fresa",
  "Bolis de Limon",
  "Bolis de Mango",
  "Empanada de Carne",
  "Empanada de Pollo",
  "Empanada de Queso",
  "Gelatina",
  "Coca Cola 350ml",
  "Coca Cola 600ml",
  "Agua 500ml",
  "Agua 1L",
];

async function main() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true },
    orderBy: { id: "asc" },
  });

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { id: "asc" },
  });

  const customers = await prisma.customer.findMany({
    orderBy: { id: "asc" },
  });

  if (users.length === 0 || products.length === 0 || customers.length === 0) {
    throw new Error(
      "Missing base data. Run the main seed first so users, products, and customers exist.",
    );
  }

  const productMap = new Map(
    products.map((product) => [product.name, product]),
  );
  const activeProducts = productNames
    .map((name) => productMap.get(name))
    .filter((product): product is NonNullable<typeof product> =>
      Boolean(product),
    );

  const now = new Date();
  const saleCount = 36;
  let createdSales = 0;

  for (let index = 0; index < saleCount; index += 1) {
    const user = users[index % users.length];
    const customer = customers[index % customers.length];
    const saleDate = new Date(now);
    saleDate.setDate(now.getDate() - (index % 12));
    saleDate.setHours(8 + (index % 10), (index * 7) % 60, (index * 13) % 60, 0);

    const selectedProducts = [...activeProducts]
      .sort(() => Math.random() - 0.5)
      .slice(0, 2 + (index % 2));

    const items = selectedProducts.map((product, itemIndex) => {
      const quantity = 1 + ((index + itemIndex) % 3);
      const subtotal = Number(product.price) * quantity;

      return {
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        subtotal,
        promotionApplied:
          product.name === "Gelatina" && quantity >= 2 ? "gelatina-2x1" : null,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = items.reduce(
      (sum, item) => sum + (item.promotionApplied ? Number(item.unitPrice) : 0),
      0,
    );
    const taxableSubtotal = subtotal - discount;
    const tax = Math.round(taxableSubtotal * 0.13 * 100) / 100;
    const total = Math.round((taxableSubtotal + tax) * 100) / 100;
    const paymentMethod = index % 3 === 0 ? "sinpe" : "cash";
    const cashReceived =
      paymentMethod === "cash" ? Math.ceil(total / 500) * 500 : null;
    const changeAmount =
      paymentMethod === "cash" && cashReceived != null
        ? Math.max(0, Math.round((cashReceived - total) * 100) / 100)
        : null;

    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          customerId: customer.id,
          userId: user.id,
          customerName: customer.name,
          subtotal: taxableSubtotal,
          tax,
          discount,
          total,
          paymentMethod,
          cashReceived,
          changeAmount,
          createdAt: saleDate,
        },
      });

      for (const item of items) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            promotionApplied: item.promotionApplied,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      createdSales += 1;
    });
  }

  console.log(`Created ${createdSales} sales with items for reports.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
