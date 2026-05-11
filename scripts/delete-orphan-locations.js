const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Mencari data Kabupaten/Kota yang tidak memiliki tower (Orphaned Locations)...");
  
  // Find locations that have no related pengukuran, lokasi_pemancar, or stasiun_radio
  const orphanLocations = await prisma.locations.findMany({
    where: {
      pengukuran: { none: {} },
      lokasi_pemancar: { none: {} },
      stasiun_radio: { none: {} }
    },
    select: {
      id: true,
      kota: true,
      provinsi: true
    }
  });

  console.log(`Ditemukan ${orphanLocations.length} kota/kabupaten yang kosong.`);
  
  if (orphanLocations.length > 0) {
    // Print a few names just to see
    console.log("Contoh yang akan dihapus:");
    orphanLocations.slice(0, 5).forEach(l => console.log(`- ${l.kota} (${l.provinsi})`));

    const idsToDelete = orphanLocations.map(l => l.id);
    const result = await prisma.locations.deleteMany({
      where: {
        id: { in: idsToDelete }
      }
    });

    console.log(`Berhasil menghapus ${result.count} data Kabupaten/Kota dari database.`);
  } else {
    console.log("Database sudah bersih, tidak ada Kabupaten/Kota yang kosong.");
  }
}

main()
  .catch((e) => {
    console.error("Terjadi kesalahan:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
