"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateTowerData(id: string, formData: FormData) {
  try {
    const operator = formData.get('operator') as string;
    const jenis = formData.get('jenis') as string;
    const provinsi = formData.get('provinsi') as string;
    const kota = formData.get('kota') as string;
    const latStr = formData.get('lat') as string;
    const lngStr = formData.get('lng') as string;

    if (!operator || !jenis || !provinsi || !kota || !latStr || !lngStr) {
      return { success: false, message: "Semua field wajib diisi." };
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      return { success: false, message: "Koordinat GPS tidak valid." };
    }

    // Ambil data pengukuran
    const pengukuran = await prisma.pengukuran.findUnique({
      where: { id: BigInt(id) },
      include: {
        stasiun_radio: true,
        lokasi_pemancar: true,
      }
    });

    if (!pengukuran) {
      return { success: false, message: "Data tidak ditemukan." };
    }

    // Cek / Buat Lokasi
    let location = await prisma.locations.findFirst({
      where: { kota: kota, provinsi: provinsi }
    });

    if (!location) {
      location = await prisma.locations.findUnique({ where: { kota: kota } });
      if (location) {
        await prisma.locations.update({ where: { id: location.id }, data: { provinsi: provinsi } });
      } else {
        location = await prisma.locations.create({ data: { kota: kota, provinsi: provinsi } });
      }
    }

    // Update Stasiun Radio
    if (pengukuran.stasiun_radio_id) {
      await prisma.stasiun_radio.update({
        where: { id: pengukuran.stasiun_radio_id },
        data: {
          nama_penyelenggara: operator,
          jenis_komunikasi: jenis,
          location_id: location.id,
        }
      });
    }

    // Update Lokasi Pemancar
    if (pengukuran.lokasi_pemancar_id) {
      await prisma.lokasi_pemancar.update({
        where: { id: pengukuran.lokasi_pemancar_id },
        data: {
          latitude: lat,
          longitude: lng,
          location_id: location.id,
        }
      });
    }

    // Update Pengukuran
    await prisma.pengukuran.update({
      where: { id: pengukuran.id },
      data: {
        location_id: location.id,
      }
    });

    revalidatePath('/dashboard/data-tabel');
    revalidatePath('/dashboard/maps');
    
    return { success: true, message: "Data berhasil diperbarui!" };
  } catch (error: any) {
    console.error("Edit Error:", error);
    return { success: false, message: "Gagal memperbarui data: " + error.message };
  }
}
