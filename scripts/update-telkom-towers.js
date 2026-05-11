const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Updating towers near Telkom University to Telkomsel...");
  
  // Telkom University bounding box
  const minLat = -6.98;
  const maxLat = -6.96;
  const minLng = 107.62;
  const maxLng = 107.64;

  const targetLocations = await prisma.lokasi_pemancar.findMany({
    where: {
      latitude: { gte: minLat, lte: maxLat },
      longitude: { gte: minLng, lte: maxLng }
    },
    include: {
      pengukuran: true
    }
  });

  const stasiunRadioIdsToUpdate = [];
  targetLocations.forEach(loc => {
    loc.pengukuran.forEach(peng => {
      if (peng.stasiun_radio_id) {
        stasiunRadioIdsToUpdate.push(peng.stasiun_radio_id);
      }
    });
  });

  if (stasiunRadioIdsToUpdate.length > 0) {
    const uniqueIds = [...new Set(stasiunRadioIdsToUpdate)];
    
    const result = await prisma.stasiun_radio.updateMany({
      where: {
        id: { in: uniqueIds }
      },
      data: {
        nama_penyelenggara: 'Telkomsel'
      }
    });

    console.log(`Successfully updated ${result.count} stasiun_radio records to 'Telkomsel' around Telkom University.`);
  } else {
    console.log("No towers found in the specified area to update.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
