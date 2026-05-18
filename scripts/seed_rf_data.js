const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const pseudoRandomSeed = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const x = Math.sin(hash++) * 10000;
  return x - Math.floor(x);
};

const getFrequencyForOperator = (operatorName, seed) => {
  const name = (operatorName || '').toLowerCase();
  if (name.includes('smartfren') || name.includes('smart')) {
    return [850, 1800, 2300][Math.floor(seed * 3)];
  }
  if (name.includes('telkomsel') || name.includes('simpati')) {
    return [900, 1800, 2100, 2300][Math.floor(seed * 4)];
  }
  if (name.includes('indosat') || name.includes('ioh') || name.includes('im3') || name.includes('hutchison') || name.includes('tri')) {
    return [900, 1800, 2100][Math.floor(seed * 3)];
  }
  if (name.includes('xl') || name.includes('axiata') || name.includes('axis')) {
    return [900, 1800, 2100][Math.floor(seed * 3)];
  }
  return 1800;
};

const getTowerParams = (id, localDensity = 0, operatorName = '') => {
  const seed = pseudoRandomSeed(id);
  const freq = getFrequencyForOperator(operatorName, seed);

  let hTower = 45;
  if (localDensity >= 5) hTower = 15;
  else if (localDensity >= 2) hTower = 25;

  const numSectorsRoll = pseudoRandomSeed(id + "sectors");
  let numSectors = 3;
  if (numSectorsRoll > 0.85) numSectors = 4;
  else if (numSectorsRoll < 0.15) numSectors = 2;

  const baseAzimuth = Math.floor(seed * 360);
  const azimuths = [];
  for (let i = 0; i < numSectors; i++) {
    const az = (baseAzimuth + (i * (360 / numSectors))) % 360;
    azimuths.push(Math.round(az));
  }

  return { freq, hTower, azimuths };
};

const TELCO_KEYWORDS = ['tele', 'seluler', 'selular', 'cellular', 'gsm', '4g', 'lte', '5g'];
const isTelco = (jenis) => {
  if (!jenis) return false;
  const j = jenis.toLowerCase();
  return TELCO_KEYWORDS.some(kw => j.includes(kw));
};

async function main() {
  console.log("Fetching telco-only pengukuran records...");

  // Only fetch measurements where jenis_komunikasi is telco/seluler
  const measurements = await prisma.pengukuran.findMany({
    select: {
      lokasi_pemancar_id: true,
      stasiun_radio: { select: { nama_penyelenggara: true, jenis_komunikasi: true } }
    },
    where: {
      lokasi_pemancar_id: { not: null },
      stasiun_radio: {
        jenis_komunikasi: { not: null }
      }
    }
  });

  // Build map: lokasi_pemancar_id → { operatorName } — ONLY for telco jenis
  const telcoLokasiIds = new Set();
  const operatorMap = new Map();

  for (const m of measurements) {
    if (!m.lokasi_pemancar_id) continue;
    const jenis = m.stasiun_radio?.jenis_komunikasi || '';
    if (!isTelco(jenis)) continue; // SKIP non-telco

    const lid = m.lokasi_pemancar_id.toString();
    telcoLokasiIds.add(lid);
    if (!operatorMap.has(lid)) {
      operatorMap.set(lid, m.stasiun_radio?.nama_penyelenggara || '');
    }
  }

  console.log(`Found ${telcoLokasiIds.size} unique telco lokasi_pemancar entries.`);

  // Fetch all towers but only process telco ones
  const allTowers = await prisma.lokasi_pemancar.findMany({
    select: { id: true, latitude: true, longitude: true },
  });

  // Filter to telco-only towers
  const telcoTowers = allTowers.filter(t => telcoLokasiIds.has(t.id.toString()));
  console.log(`Processing ${telcoTowers.length} telco towers out of ${allTowers.length} total towers.`);

  let updatedCount = 0;
  for (const t of telcoTowers) {
    // Density: count OTHER telco towers within 1km
    let localDensity = 0;
    for (const other of telcoTowers) {
      if (other.id !== t.id) {
        const d = calculateDistance(Number(t.latitude), Number(t.longitude), Number(other.latitude), Number(other.longitude));
        if (d < 1000) localDensity++;
      }
    }

    const operatorName = operatorMap.get(t.id.toString()) || '';
    const { freq, hTower, azimuths } = getTowerParams(t.id.toString(), localDensity, operatorName);

    await prisma.lokasi_pemancar.update({
      where: { id: t.id },
      data: {
        frekuensi: freq,
        tinggi_menara_m: hTower,
        azimuths: JSON.stringify(azimuths),
      }
    });

    updatedCount++;
    if (updatedCount % 100 === 0) console.log(`  Updated ${updatedCount}/${telcoTowers.length}...`);
  }

  console.log(`\n✅ Done. Updated ${updatedCount} telco towers only. Non-telco towers were NOT touched.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
