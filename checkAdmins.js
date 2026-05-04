const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.users.findMany({
    where: {
      OR: [
        { role: 'admin' },
        { is_admin: true }
      ]
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      is_admin: true
    }
  });

  console.log("Admin Users:");
  console.table(admins);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
