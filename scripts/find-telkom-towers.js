const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Searching for towers near Telkom University...");
  
  // Try searching by address containing keywords
  const towers = await prisma.lokasi_pemancar.findMany({
    where: {
      OR: [
        { alamat: { contains: 'Telekomunikasi' } },
        { alamat: { contains: 'Bojongsoang' } },
        { alamat: { contains: 'Dayeuhkolot' } },
        { alamat: { contains: 'Telkom' } }
      ]
    },
    include: {
      pengukuran: {
        include: {
          stasiun_radio: true
        }
      }
    }
  });

  console.log(`Found ${towers.length} potential locations by address.`);
  
  // Try searching by coordinates (approx bounds for Telkom University)
  // Lat: -6.97 to -6.98
  // Lng: 107.62 to 107.64
  const towersByGeo = await prisma.lokasi_pemancar.findMany({
    where: {
      latitude: { gte: -6.98, lte: -6.96 },
      longitude: { gte: 107.62, lte: 107.64 }
    },
    include: {
      pengukuran: {
        include: {
          stasiun_radio: true
        }
      }
    }
  });

  console.log(`Found ${towersByGeo.length} potential locations by coordinates.`);

  const allTowers = [...towers, ...towersByGeo];
  const uniqueTowers = Array.from(new Set(allTowers.map(a => a.id))).map(id => allTowers.find(a => a.id === id));

  for (const tower of uniqueTowers) {
    console.log(`ID: ${tower.id}, Address: ${tower.alamat}, Lat: ${tower.latitude}, Lng: ${tower.longitude}`);
    for (const peng of tower.pengukuran) {
      if (peng.stasiun_radio) {
        console.log(`  -> Operator: ${peng.stasiun_radio.nama_penyelenggara}, Jenis: ${peng.stasiun_radio.jenis_komunikasi}`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
