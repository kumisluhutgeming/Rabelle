const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const locs = await prisma.locations.findMany({ take: 1 });
  console.log(locs);
}

main().finally(() => prisma.$disconnect());
