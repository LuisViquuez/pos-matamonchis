import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const connectionString = (process.env.DATABASE_URL ?? "").replace(
  /sslmode=(prefer|require|verify-ca)/,
  "sslmode=verify-full",
);

const adapter = new PrismaPg({ connectionString });

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
