"use server";

import prisma from "@/lib/prisma";
import { revalidateTowerPaths } from "@/lib/tower";

export async function deleteTowerData(id: string) {
  try {
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
  } catch (error: any) {
    console.error("Delete Error:", error);
    return { success: false, message: "Gagal menghapus data: " + error.message };
  }
}
