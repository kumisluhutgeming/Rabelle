const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ops = await prisma.stasiun_radio.findMany({
    select: { nama_penyelenggara: true },
    distinct: ['nama_penyelenggara']
  });
  console.log(JSON.stringify(ops, null, 2));
  console.log('Total:', ops.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
