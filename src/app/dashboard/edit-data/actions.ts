"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();
const genericNames = ['communication', 'tower', 'mast', 'unknown', ''];

function isGeneric(name: string | null | undefined) {
  if (!name) return true;
  return genericNames.includes(name.toLowerCase().trim());
}

export async function uploadGeojson(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const kotaName = formData.get('kota') as string;

    if (!file || !kotaName) {
      return { success: false, message: "File atau Nama Kota tidak valid." };
    }

    const text = await file.text();
    const geojson = JSON.parse(text);
    const features = geojson.features || [];

    // Ensure location exists
    let location = await prisma.locations.findUnique({ where: { kota: kotaName } });
    if (!location) {
      location = await prisma.locations.create({ data: { kota: kotaName } });
    }

    let newCount = 0;
    let updateCount = 0;
    let skippedCount = 0;

    for (const feature of features) {
      if (!feature.geometry || !feature.geometry.coordinates) continue;

      let lon, lat;
      if (feature.geometry.type === 'Point') {
        lon = feature.geometry.coordinates[0];
        lat = feature.geometry.coordinates[1];
      } else if (feature.geometry.type === 'Polygon') {
        lon = feature.geometry.coordinates[0][0][0];
        lat = feature.geometry.coordinates[0][0][1];
      } else if (feature.geometry.type === 'LineString') {
        lon = feature.geometry.coordinates[0][0];
        lat = feature.geometry.coordinates[0][1];
      } else {
        continue;
      }

      if (isNaN(lon) || isNaN(lat)) continue;

      const props = feature.properties || {};

      let operatorName = props.operator || props.name || props['tower:type'] || 'Unknown';
      let jenisKomp = props['tower:type'] === 'communication' ? 'BTS' : (props['tower:type'] || 'Lainnya');

      const delta = 0.000001;
      const existingLoks = await prisma.lokasi_pemancar.findMany({
        where: {
          latitude: { gte: lat - delta, lte: lat + delta },
          longitude: { gte: lon - delta, lte: lon + delta }
        },
        include: {
          pengukuran: {
            include: { stasiun_radio: true }
          }
        }
      });

      if (existingLoks.length > 0) {
        // Exists, check if we should update specific name
        const existingLok = existingLoks[0];
        const pengukuran = existingLok.pengukuran[0];
        
        if (pengukuran && pengukuran.stasiun_radio) {
          const stasiun = pengukuran.stasiun_radio;
          const existingName = stasiun.nama_penyelenggara;

          if (isGeneric(existingName) && !isGeneric(operatorName)) {
            await prisma.stasiun_radio.update({
              where: { id: stasiun.id },
              data: { nama_penyelenggara: operatorName, jenis_komunikasi: jenisKomp }
            });
            updateCount++;
          } else {
            skippedCount++;
          }
        } else {
          skippedCount++;
        }
      } else {
        // Create new
        const stasiun = await prisma.stasiun_radio.create({
          data: {
            nama_penyelenggara: operatorName,
            jenis_komunikasi: jenisKomp,
            location_id: location.id
          }
        });

        const lokasi = await prisma.lokasi_pemancar.create({
          data: {
            latitude: lat,
            longitude: lon,
            alamat: `${operatorName} at ${lat}, ${lon}`,
            location_id: location.id
          }
        });

        await prisma.pengukuran.create({
          data: {
            stasiun_radio_id: stasiun.id,
            lokasi_pemancar_id: lokasi.id,
            location_id: location.id
          }
        });

        newCount++;
      }
    }

    revalidatePath('/dashboard/maps');
    revalidatePath('/dashboard/data-tabel');
    revalidatePath('/dashboard');

    return { 
      success: true, 
      message: `Impor berhasil! Ditambahkan: ${newCount}, Diperbarui: ${updateCount}, Dilewati (Duplikat): ${skippedCount}` 
    };

  } catch (error: any) {
    console.error("GeoJSON Error:", error);
    return { success: false, message: "Gagal memproses file: " + error.message };
  }
}

export async function saveGpsTower(formData: FormData) {
  try {
    const operator = formData.get('operator') as string;
    const provinsi = formData.get('provinsi') as string;
    const kota = formData.get('kota') as string;
    const jenis = formData.get('jenis') as string;
    const latStr = formData.get('lat') as string;
    const lngStr = formData.get('lng') as string;

    if (!operator || !kota || !provinsi || !jenis || !latStr || !lngStr) {
      return { success: false, message: "Semua field harus diisi." };
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      return { success: false, message: "Koordinat GPS tidak valid." };
    }

    // Ensure location exists
    let location = await prisma.locations.findFirst({ where: { kota: kota, provinsi: provinsi } });
    if (!location) {
      // Find by kota alone first
      location = await prisma.locations.findUnique({ where: { kota: kota } });
      if (location) {
        await prisma.locations.update({ where: { id: location.id }, data: { provinsi: provinsi } });
      } else {
        location = await prisma.locations.create({ data: { kota: kota, provinsi: provinsi } });
      }
    }

    // Create new
    const stasiun = await prisma.stasiun_radio.create({
      data: {
        nama_penyelenggara: operator,
        jenis_komunikasi: jenis,
        location_id: location.id
      }
    });

    const lokasi = await prisma.lokasi_pemancar.create({
      data: {
        latitude: lat,
        longitude: lng,
        alamat: `${operator} (Manual Input)`,
        location_id: location.id
      }
    });

    await prisma.pengukuran.create({
      data: {
        stasiun_radio_id: stasiun.id,
        lokasi_pemancar_id: lokasi.id,
        location_id: location.id
      }
    });

    revalidatePath('/dashboard/maps');
    revalidatePath('/dashboard/data-tabel');
    revalidatePath('/dashboard');

    return { success: true, message: "Menara baru berhasil ditambahkan!" };
  } catch (error: any) {
    console.error("GPS Error:", error);
    return { success: false, message: "Gagal menambahkan data: " + error.message };
  }
}
