import { PrismaClient } from '@prisma/client'

// Monkey patch for BigInt serialization issue in Next.js/JSON
if (typeof BigInt !== "undefined" && !(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}

const prismaClientSingleton = () => {
  return new PrismaClient().$extends({
    query: {
      audit_logs: {
        async update({ args, query }) {
          throw new Error("Audit logs are immutable and cannot be updated.");
        },
        async updateMany({ args, query }) {
          throw new Error("Audit logs are immutable and cannot be updated.");
        },
        async delete({ args, query }) {
          throw new Error("Audit logs are immutable and cannot be deleted.");
        },
        async deleteMany({ args, query }) {
          throw new Error("Audit logs are immutable and cannot be deleted.");
        },
      },
    },
  });
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma as any;
