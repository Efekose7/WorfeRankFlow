/**
 * Prisma Client wrapper.
 * In production, run `prisma generate` and `prisma migrate deploy` before starting.
 * The client is lazily initialized so the module loads without the generated binaries.
 */

let _prisma: any = null;

function createPrismaClient() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client');
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  } catch {
    // Prisma client not generated yet — return a proxy that throws on access
    return new Proxy({}, {
      get(_t, prop) {
        if (prop === '$connect' || prop === '$disconnect') return () => Promise.resolve();
        throw new Error(
          `Prisma Client not generated. Run: npx prisma generate\n` +
          `Then: npx prisma db push (or prisma migrate deploy in production)`
        );
      },
    });
  }
}

const globalForPrisma = globalThis as unknown as { prisma: any };

export const prisma: any = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
