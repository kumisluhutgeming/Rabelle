"use server";

import prisma from "@/lib/prisma";
import { revalidateTowerPaths } from "@/lib/tower";
import { createSafeAction } from "@/lib/middleware/action-wrapper";
import { z } from "zod";

export const deleteTowerData = createSafeAction<string, null>(
  null,
  "admin",
  "MUTATION",
  "Hapus Menara",
  async (id) => {
    const pengukuran = await prisma.pengukuran.findUnique({
      where: { id: BigInt(id) },
    });

    if (!pengukuran) {
      return { success: false, message: "Data tidak ditemukan." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.pengukuran.delete({ where: { id: pengukuran.id } });

      if (pengukuran.stasiun_radio_id) {
        const count = await tx.pengukuran.count({
          where: { stasiun_radio_id: pengukuran.stasiun_radio_id },
        });
        if (count === 0) {
          await tx.stasiun_radio.delete({ where: { id: pengukuran.stasiun_radio_id } });
        }
      }

      if (pengukuran.lokasi_pemancar_id) {
        const count = await tx.pengukuran.count({
          where: { lokasi_pemancar_id: pengukuran.lokasi_pemancar_id },
        });
        if (count === 0) {
          await tx.lokasi_pemancar.delete({ where: { id: pengukuran.lokasi_pemancar_id } });
        }
      }
    });

    revalidateTowerPaths();

    return { success: true, message: "Data berhasil dihapus." };
  }
);

interface ExportParams {
  jenis?: string;
  provinsi?: string;
  kota?: string;
  operator?: string;
}

export const exportCsvData = createSafeAction<ExportParams, null>(
  null,
  "user",
  "QUERY",
  "Export Data",
  async (params) => {
    const where: any = {};
    const radioWhere: any = {};
    if (params.jenis) {
      radioWhere.jenis_komunikasi = params.jenis;
    }
    if (params.operator) {
      radioWhere.nama_penyelenggara = params.operator;
    }
    if (Object.keys(radioWhere).length > 0) {
      where.stasiun_radio = radioWhere;
    }
    if (params.provinsi) {
      where.locations = { ...where.locations, provinsi: params.provinsi };
    }
    if (params.kota) {
      where.locations = { ...where.locations, kota: params.kota };
    }

    const data = await prisma.pengukuran.findMany({
      where,
      include: {
        stasiun_radio: true,
        locations: true,
        lokasi_pemancar: true
      }
    });

    // Create CSV content
    const headers = ["ID", "Nama Operator", "Jenis Komunikasi", "Provinsi", "Kabupaten/Kota", "Latitude", "Longitude", "Alamat"];
    const rows = data.map(p => {
      return [
        p.id.toString(),
        `"${(p.stasiun_radio?.nama_penyelenggara || '').replace(/"/g, '""')}"`,
        `"${p.stasiun_radio?.jenis_komunikasi || ''}"`,
        `"${p.locations?.provinsi || ''}"`,
        `"${p.locations?.kota || ''}"`,
        p.lokasi_pemancar?.latitude || '',
        p.lokasi_pemancar?.longitude || '',
        `"${(p.lokasi_pemancar?.alamat || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    return { success: true, csv: csvContent };
  }
);
