"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteTowerData(id: string) {
  try {
    const pengukuran = await prisma.pengukuran.findUnique({
      where: { id: BigInt(id) },
    });

    if (!pengukuran) {
      return { success: false, message: "Data tidak ditemukan." };
    }

    // Delete in transaction to ensure all related data is cleaned up
    await prisma.$transaction(async (tx) => {
      // Delete the pengukuran
      await tx.pengukuran.delete({
        where: { id: pengukuran.id }
      });

      // Optionally clean up stasiun_radio if not used elsewhere
      if (pengukuran.stasiun_radio_id) {
        const countStasiun = await tx.pengukuran.count({
          where: { stasiun_radio_id: pengukuran.stasiun_radio_id }
        });
        if (countStasiun === 0) {
          await tx.stasiun_radio.delete({
            where: { id: pengukuran.stasiun_radio_id }
          });
        }
      }

      // Optionally clean up lokasi_pemancar if not used elsewhere
      if (pengukuran.lokasi_pemancar_id) {
        const countLokasi = await tx.pengukuran.count({
          where: { lokasi_pemancar_id: pengukuran.lokasi_pemancar_id }
        });
        if (countLokasi === 0) {
          await tx.lokasi_pemancar.delete({
            where: { id: pengukuran.lokasi_pemancar_id }
          });
        }
      }
    });

    revalidatePath('/dashboard/data-tabel');
    revalidatePath('/dashboard/maps');
    
    return { success: true, message: "Data berhasil dihapus." };
  } catch (error: any) {
    console.error("Delete Error:", error);
    return { success: false, message: "Gagal menghapus data: " + error.message };
  }
}
