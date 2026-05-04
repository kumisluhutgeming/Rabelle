const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Deleting lighting points...");
  
  // Find all stasiun_radio where jenis_komunikasi is like '%lighting%'
  const stasiuns = await prisma.stasiun_radio.findMany({
    where: {
      jenis_komunikasi: {
        contains: 'lighting'
      }
    }
  });

  console.log(`Found ${stasiuns.length} lighting points.`);

  let deleted = 0;
  for (const stasiun of stasiuns) {
    // Delete related pengukuran first (if any)
    await prisma.pengukuran.deleteMany({
      where: { stasiun_radio_id: stasiun.id }
    });
    
    // The location_id or lokasi_pemancar_id might be orphaned, but the main entity is stasiun_radio.
    // Let's also find the pengukuran records to get lokasi_pemancar_id.
    // Wait, the user said "hapus titik yang jenisnya lighting". It's safest to just delete the stasiun_radio and measurements.
    
    await prisma.stasiun_radio.delete({
      where: { id: stasiun.id }
    });
    deleted++;
  }

  console.log(`Deleted ${deleted} lighting points successfully.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
