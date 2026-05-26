"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function importTowers(data: any[]) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.isAdmin;

    if (!isAdmin) {
      return { success: false, error: "Unauthorized. Fitur ini hanya untuk Admin." };
    }

    if (!data || data.length === 0) {
      return { success: false, error: "Data kosong." };
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
        azimuths = JSON.stringify(azimuths.split(",").map(a => Number(a.trim())));
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

    // Log the import to audit_logs
    await prisma.audit_logs.create({
      data: {
        user_id: session.user?.id ? BigInt(session.user.id) : null,
        action: "IMPORT_DATA",
        details: `Telah mengimpor/menambahkan ${successCount} data menara baru.`,
        created_at: new Date()
      }
    });

    return { success: true, count: successCount };
  } catch (error: any) {
    console.error("Import error:", error);
    return { success: false, error: error.message || "Failed to import data" };
  }
}
