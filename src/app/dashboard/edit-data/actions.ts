"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { upsertLocation, revalidateTowerPaths } from "@/lib/tower";

import { createAuditLog } from "@/lib/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const GpsTowerSchema = z.object({
  operator: z.string().min(1, "Nama Operator wajib diisi"),
  provinsi: z.string().min(1, "Provinsi wajib diisi"),
  kota: z.string().min(1, "Kota wajib diisi"),
  jenis: z.string().min(1, "Jenis Komunikasi wajib diisi"),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

const genericNames = ["communication", "tower", "mast", "unknown", ""];

function isGeneric(name: string | null | undefined) {
  if (!name) return true;
  return genericNames.includes(name.toLowerCase().trim());
}

export async function uploadGeojson(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return { success: false, message: "Unauthorized: Akses ditolak." };
    }

    const file = formData.get("file") as File;
    const kotaName = formData.get("kota") as string;

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
      if (feature.geometry.type === "Point") {
        lon = feature.geometry.coordinates[0];
        lat = feature.geometry.coordinates[1];
      } else if (feature.geometry.type === "Polygon") {
        lon = feature.geometry.coordinates[0][0][0];
        lat = feature.geometry.coordinates[0][0][1];
      } else if (feature.geometry.type === "LineString") {
        lon = feature.geometry.coordinates[0][0];
        lat = feature.geometry.coordinates[0][1];
      } else {
        continue;
      }

      if (isNaN(lon) || isNaN(lat)) continue;

      const props = feature.properties || {};
      const operatorName = props.operator || props.name || props["tower:type"] || "Unknown";
      const jenisKomp =
        props["tower:type"] === "communication" ? "Telekomunikasi/Seluler" : props["tower:type"] || "Lainnya";

      const delta = 0.000001;
      const existingLoks = await prisma.lokasi_pemancar.findMany({
        where: {
          latitude: { gte: lat - delta, lte: lat + delta },
          longitude: { gte: lon - delta, lte: lon + delta },
        },
        include: {
          pengukuran: { include: { stasiun_radio: true } },
        },
      });

      if (existingLoks.length > 0) {
        const existingLok = existingLoks[0];
        const pengukuran = existingLok.pengukuran[0];

        if (pengukuran && pengukuran.stasiun_radio) {
          const stasiun = pengukuran.stasiun_radio;
          if (isGeneric(stasiun.nama_penyelenggara) && !isGeneric(operatorName)) {
            await prisma.stasiun_radio.update({
              where: { id: stasiun.id },
              data: { nama_penyelenggara: operatorName, jenis_komunikasi: jenisKomp },
            });
            updateCount++;
          } else {
            skippedCount++;
          }
        } else {
          skippedCount++;
        }
      } else {
        const stasiun = await prisma.stasiun_radio.create({
          data: {
            nama_penyelenggara: operatorName,
            jenis_komunikasi: jenisKomp,
            location_id: location.id,
          },
        });

        const lokasi = await prisma.lokasi_pemancar.create({
          data: {
            latitude: lat,
            longitude: lon,
            alamat: `${operatorName} at ${lat}, ${lon}`,
            location_id: location.id,
          },
        });

        await prisma.pengukuran.create({
          data: {
            stasiun_radio_id: stasiun.id,
            lokasi_pemancar_id: lokasi.id,
            location_id: location.id,
          },
        });

        newCount++;
      }
    }

    revalidateTowerPaths();

    await createAuditLog("Impor GeoJSON", `Menambahkan ${newCount} menara baru dan memperbarui ${updateCount} menara di kota ${kotaName}`);

    return {
      success: true,
      message: `Impor berhasil! Ditambahkan: ${newCount}, Diperbarui: ${updateCount}, Dilewati (Duplikat): ${skippedCount}`,
    };
  } catch (error: any) {
    console.error("GeoJSON Error:", error);
    return { success: false, message: "Gagal memproses file: " + error.message };
  }
}

export async function saveGpsTower(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return { success: false, message: "Unauthorized: Akses ditolak." };
    }

    const rawData = {
      operator: formData.get("operator"),
      provinsi: formData.get("provinsi"),
      kota: formData.get("kota"),
      jenis: formData.get("jenis"),
      lat: formData.get("lat"),
      lng: formData.get("lng"),
    };

    const validation = GpsTowerSchema.safeParse(rawData);

    if (!validation.success) {
      return { 
        success: false, 
        message: "Validasi gagal: " + validation.error.issues.map((e: any) => e.message).join(", ") 
      };
    }

    const { operator, provinsi, kota, jenis, lat, lng } = validation.data;

    const location = await upsertLocation(kota, provinsi);

    const stasiun = await prisma.stasiun_radio.create({
      data: {
        nama_penyelenggara: operator,
        jenis_komunikasi: jenis,
        location_id: location.id,
      },
    });

    const lokasi = await prisma.lokasi_pemancar.create({
      data: {
        latitude: lat,
        longitude: lng,
        alamat: `${operator} (Manual Input)`,
        location_id: location.id,
      },
    });

    await prisma.pengukuran.create({
      data: {
        stasiun_radio_id: stasiun.id,
        lokasi_pemancar_id: lokasi.id,
        location_id: location.id,
      },
    });

    revalidateTowerPaths();

    await createAuditLog("Tambah Menara Baru", `Menambahkan menara operator ${operator} (${jenis}) di ${kota}, ${provinsi}`);

    return { success: true, message: "Menara baru berhasil ditambahkan!" };
  } catch (error: any) {
    console.error("GPS Error:", error);
    return { success: false, message: "Gagal menambahkan data: " + error.message };
  }
}
