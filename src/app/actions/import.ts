"use server";

import prisma from "@/lib/prisma";
import { createSafeAction } from "@/lib/middleware/action-wrapper";

export const importTowers = createSafeAction<any[], any>(
  null,
  "admin",
  "MUTATION",
  "IMPORT_DATA",
  async (data) => {
    if (!data || data.length === 0) {
      return { success: false, message: "Data kosong." };
    }

    let successCount = 0;

    // Process each row
    for (const row of data) {
      // Normalization handles variations in column names (from CSV or manual form)
      const operatorName = (row.Operator || row.nama_penyelenggara || "").toString().trim();
      const jenis = (row["Jenis Komunikasi"] || row.jenis_komunikasi || "Lainnya").toString().trim();
      const kota = (row.Kota || row.kota || "").toString().trim();
      const provinsi = (row.Provinsi || row.provinsi || "").toString().trim();
      const latStr = (row.Latitude || row.latitude || "").toString().trim();
      const lngStr = (row.Longitude || row.longitude || "").toString().trim();
      const hTower = row["Tinggi Menara (m)"] || row.tinggi_menara_m || null;
      const freq = row.Frekuensi || row.frekuensi || null;
      
      let azimuths = row.Azimuths || row.azimuths || null;
      if (typeof azimuths === "string" && azimuths.includes(",")) {
        azimuths = JSON.stringify(azimuths.split(",").map((a: string) => Number(a.trim())));
      }

      if (!operatorName || !kota || !latStr || !lngStr) {
        continue; // Skip invalid rows
      }

      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);

      if (isNaN(lat) || isNaN(lng)) continue;

      // 1. Resolve Location
      let locationRecord = await prisma.locations.findUnique({
        where: { kota: kota }
      });

      if (!locationRecord) {
        locationRecord = await prisma.locations.create({
          data: { kota, provinsi, created_at: new Date(), updated_at: new Date() }
        });
      }

      // 2. Resolve Operator (Stasiun Radio)
      let stationRecord = await prisma.stasiun_radio.findFirst({
        where: { nama_penyelenggara: operatorName, jenis_komunikasi: jenis }
      });

      if (!stationRecord) {
        stationRecord = await prisma.stasiun_radio.create({
          data: { 
            nama_penyelenggara: operatorName, 
            jenis_komunikasi: jenis,
            location_id: locationRecord.id,
            created_at: new Date(),
            updated_at: new Date()
          }
        });
      }

      // 3. Create Lokasi Pemancar
      const pemancarRecord = await prisma.lokasi_pemancar.create({
        data: {
          latitude: lat,
          longitude: lng,
          alamat: `${kota}, ${provinsi}`,
          tinggi_menara_m: hTower ? parseFloat(hTower.toString()) : null,
          frekuensi: freq ? parseInt(freq.toString()) : null,
          azimuths: azimuths ? azimuths.toString() : null,
          location_id: locationRecord.id,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // 4. Create Pengukuran Mapping
      await prisma.pengukuran.create({
        data: {
          stasiun_radio_id: stationRecord.id,
          lokasi_pemancar_id: pemancarRecord.id,
          location_id: locationRecord.id,
          tanggal_pengukuran: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      successCount++;
    }

    return { success: true, count: successCount, message: `Berhasil mengimpor ${successCount} data menara.` };
  }
);
