const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching data from database...');
  
  // Fetch all measurements with related data
  const data = await prisma.pengukuran.findMany({
    select: {
      id: true,
      stasiun_radio: {
        select: {
          nama_penyelenggara: true,
          jenis_komunikasi: true,
        }
      },
      locations: {
        select: {
          kota: true,
          provinsi: true,
        }
      },
      lokasi_pemancar: {
        select: {
          latitude: true,
          longitude: true,
          tinggi_menara_m: true,
          frekuensi: true,
          azimuths: true,
        }
      }
    }
  });

  console.log(`Found ${data.length} records. Generating CSV...`);

  // CSV Header
  let csv = 'ID,Operator,Jenis Komunikasi,Kota,Provinsi,Latitude,Longitude,Tinggi Menara (m),Frekuensi,Azimuths\n';

  // Process data
  for (const item of data) {
    const id = item.id;
    
    // Safely extract string fields and escape commas
    const operator = `"${item.stasiun_radio?.nama_penyelenggara || ''}"`;
    const jenis = `"${item.stasiun_radio?.jenis_komunikasi || ''}"`;
    const kota = `"${item.locations?.kota || ''}"`;
    const provinsi = `"${item.locations?.provinsi || ''}"`;
    
    const lat = item.lokasi_pemancar?.latitude || '';
    const lng = item.lokasi_pemancar?.longitude || '';
    const hTower = item.lokasi_pemancar?.tinggi_menara_m || '';
    const freq = item.lokasi_pemancar?.frekuensi || '';
    
    // Parse azimuths to a simple string if present
    let azimuthsStr = '';
    if (item.lokasi_pemancar?.azimuths) {
      try {
        const parsed = JSON.parse(item.lokasi_pemancar.azimuths);
        if (Array.isArray(parsed)) {
          azimuthsStr = `"${parsed.join(',')}"`;
        } else {
          azimuthsStr = `"${item.lokasi_pemancar.azimuths}"`;
        }
      } catch (e) {
        azimuthsStr = `"${item.lokasi_pemancar.azimuths}"`;
      }
    }

    csv += `${id},${operator},${jenis},${kota},${provinsi},${lat},${lng},${hTower},${freq},${azimuthsStr}\n`;
  }

  const filename = 'tower_data_export.csv';
  fs.writeFileSync(filename, csv);
  
  console.log(`Successfully exported data to ${filename}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
