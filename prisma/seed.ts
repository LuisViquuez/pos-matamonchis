import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("=== Iniciando Seed de LA MATAMONCHIS S.A ===");

  // 1. Usuarios (Admin y Cajero)
  const adminPassword = "$2b$10$rQZ8K3.VqJ7Y5X2F1u8P8OzW9Y4L6N8M3A5B7C9D1E3F5G7H9I1J3";

  await prisma.user.upsert({
    where: { email: "admin@matamonchis.com" },
    update: {},
    create: {
      name: "Admin Usuario",
      email: "admin@matamonchis.com",
      passwordHash: adminPassword,
      role: "admin",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "cajero@matamonchis.com" },
    update: {},
    create: {
      name: "Cajero Principal",
      email: "cajero@matamonchis.com",
      passwordHash: adminPassword,
      role: "cashier",
      isActive: true,
    },
  });

  // 2. Productos
  const products = [
    { name: "Papas Fritas", price: 3500, category: "Snacks", stock: 100 },
    { name: "Papas Naturales", price: 3000, category: "Snacks", stock: 80 },
    { name: "Bolis de Fresa", price: 1500, category: "Helados", stock: 150 },
    { name: "Bolis de Limon", price: 1500, category: "Helados", stock: 150 },
    { name: "Bolis de Mango", price: 1500, category: "Helados", stock: 120 },
    { name: "Empanada de Carne", price: 4000, category: "Comidas", stock: 50 },
    { name: "Empanada de Pollo", price: 4000, category: "Comidas", stock: 50 },
    { name: "Empanada de Queso", price: 3500, category: "Comidas", stock: 60 },
    { name: "Gelatina de Fresa", price: 2000, category: "Postres", stock: 80 },
    { name: "Gelatina de Uva", price: 2000, category: "Postres", stock: 70 },
    { name: "Gelatina de Limon", price: 2000, category: "Postres", stock: 75 },
    { name: "Coca Cola 350ml", price: 3000, category: "Bebidas", stock: 200 },
    { name: "Coca Cola 600ml", price: 4500, category: "Bebidas", stock: 150 },
    { name: "Agua 500ml", price: 2000, category: "Bebidas", stock: 250 },
    { name: "Agua 1L", price: 3500, category: "Bebidas", stock: 100 },
  ];

  for (const p of products) {
    await prisma.product.create({
      data: { ...p, isActive: true },
    });
  }

  // 3. Promociones
  const promo2x1 = await prisma.promotion.upsert({
    where: { id: "gelatina-2x1" },
    update: {},
    create: {
      id: "gelatina-2x1",
      name: "Gelatina 2x1",
      type: "2x1",
      discountValue: 0,
      minQuantity: 2,
      isActive: true,
    },
  });

  // 4. Vincular Promoción a productos que contienen "Gelatina"
  const gelatinas = await prisma.product.findMany({
    where: { name: { contains: "Gelatina", mode: "insensitive" } },
  });

  for (const g of gelatinas) {
    await prisma.productPromotion.upsert({
      where: {
        productId_promotionId: {
          productId: g.id,
          promotionId: promo2x1.id,
        },
      },
      update: {},
      create: {
        productId: g.id,
        promotionId: promo2x1.id,
      },
    });
  }

  // 5. Clientes
  const customers = [
    { name: "Cliente General", email: "general@matamonchis.com" }, // Email ficticio para cumplir unicidad si fuera necesario
    { name: "Maria Garcia", phone: "3001234567", email: "maria@email.com" },
    { name: "Juan Rodriguez", phone: "3009876543", email: "juan@email.com" },
  ];

  for (const c of customers) {
    await prisma.customer.create({
      data: c,
    });
  }

  console.log("=== Seed completado con éxito ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });