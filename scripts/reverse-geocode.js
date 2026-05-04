const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const genericProvinces = [
  'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 
  'Banten', 'DKI Jakarta', 'DI Jogja', 'Bali'
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("Starting Reverse Geocoding...");

  // Get all lokasi_pemancar linked to a location that is generic
  const lokasis = await prisma.lokasi_pemancar.findMany({
    include: {
      locations: true,
      pengukuran: true
    }
  });

  const targetLokasis = lokasis.filter(l => l.locations && genericProvinces.includes(l.locations.kota));
  console.log(`Found ${targetLokasis.length} coordinates needing reverse geocoding.`);

  let updatedCount = 0;

  // Process in batches or sequentially to avoid rate limiting
  for (let i = 0; i < targetLokasis.length; i++) {
    const lok = targetLokasis[i];
    const provinsiName = lok.locations.kota; // e.g. "Jawa Barat"
    
    // We already know the province. We just need the city.
    let kotaName = null;
    
    try {
      const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lok.latitude}&longitude=${lok.longitude}&localityLanguage=id`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        kotaName = data.city || data.locality || null;
      }
    } catch (e) {
      console.error(`Error fetching geocode for ${lok.id}`);
    }

    if (kotaName) {
      // Ensure 'Kabupaten' or 'Kota' prefix if not there
      if (!kotaName.toLowerCase().includes('kota') && !kotaName.toLowerCase().includes('kabupaten')) {
        kotaName = `Kota/Kab. ${kotaName}`;
      }

      // Check if location exists
      let newLoc = await prisma.locations.findFirst({
        where: { kota: kotaName, provinsi: provinsiName }
      });

      if (!newLoc) {
        // Find by kota name only first
        newLoc = await prisma.locations.findUnique({ where: { kota: kotaName } });
        if (newLoc) {
           await prisma.locations.update({ where: { id: newLoc.id }, data: { provinsi: provinsiName } });
        } else {
           newLoc = await prisma.locations.create({
             data: { kota: kotaName, provinsi: provinsiName }
           });
        }
      }

      // Update lokasi_pemancar and pengukuran and stasiun_radio
      await prisma.lokasi_pemancar.update({
        where: { id: lok.id },
        data: { location_id: newLoc.id }
      });

      for (const peng of lok.pengukuran) {
        await prisma.pengukuran.update({
          where: { id: peng.id },
          data: { location_id: newLoc.id }
        });
        await prisma.stasiun_radio.update({
          where: { id: peng.stasiun_radio_id },
          data: { location_id: newLoc.id }
        });
      }

      updatedCount++;
    }

    if (i % 50 === 0) {
      console.log(`Processed ${i}/${targetLokasis.length} - Updated: ${updatedCount}`);
    }
    
    await sleep(200); // 5 requests per second
  }

  console.log(`Reverse geocoding complete! Updated ${updatedCount} records.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
