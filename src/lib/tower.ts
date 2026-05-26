import prisma from "@/lib/prisma";
import { TOWER_REVALIDATE_PATHS } from "@/lib/constants";
import { revalidatePath } from "next/cache";

/**
 * Cari atau buat entri `locations` berdasarkan kota + provinsi.
 * Jika kota sudah ada tapi provinsinya beda, provinsi diupdate.
 */
export async function upsertLocation(kota: string, provinsi: string) {
  let location = await prisma.locations.findFirst({
    where: { kota, provinsi },
  });

  if (!location) {
    location = await prisma.locations.findUnique({ where: { kota } });
    if (location) {
      await prisma.locations.update({
        where: { id: location.id },
        data: { provinsi },
      });
    } else {
      location = await prisma.locations.create({
        data: { kota, provinsi },
      });
    }
  }

  return location;
}

/** Revalidate semua route yang menampilkan data tower */
export function revalidateTowerPaths() {
  TOWER_REVALIDATE_PATHS.forEach((p) => revalidatePath(p));
}
