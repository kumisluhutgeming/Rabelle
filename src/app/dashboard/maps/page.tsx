import prisma from "@/lib/prisma";
import MapWrapper from "./MapWrapper";
import FloatingFilter from "./FloatingFilter";
import { EXCLUDED_JENIS } from "@/lib/constants";

export const revalidate = 0; // Disable static rendering

export default async function MapsPage({
  searchParams
}: {
  searchParams: Promise<{ jenis?: string; provinsi?: string; kota?: string }>
}) {
  const resolvedParams = await searchParams;

  // Build where clause
  const where: any = {};
  const locWhere: any = {};
  
  if (resolvedParams.jenis) {
    where.stasiun_radio = {
      jenis_komunikasi: resolvedParams.jenis
    };
  }

  if (resolvedParams.provinsi) {
    locWhere.provinsi = resolvedParams.provinsi;
    where.locations = { ...where.locations, provinsi: resolvedParams.provinsi };
  }

  if (resolvedParams.kota) {
    where.locations = { ...where.locations, kota: resolvedParams.kota };
  }

  // Fetch data
  const [pengukuranList, locations, provinsis, jenisList] = await Promise.all([
    prisma.pengukuran.findMany({
      where,
      include: {
        stasiun_radio: true,
        locations: true,
        lokasi_pemancar: true
      }
    }),
    prisma.locations.findMany({
      where: locWhere,
      select: { id: true, kota: true, provinsi: true },
      distinct: ['kota']
    }),
    prisma.locations.findMany({
      select: { provinsi: true },
      where: { provinsi: { not: null } },
      distinct: ['provinsi']
    }),
    prisma.stasiun_radio.findMany({
      where: { jenis_komunikasi: { notIn: EXCLUDED_JENIS } },
      select: { jenis_komunikasi: true },
      distinct: ['jenis_komunikasi']
    })
  ]);

  // Format markers
  const markers = pengukuranList
    .filter(p => p.lokasi_pemancar?.latitude && p.lokasi_pemancar?.longitude)
    .map(p => ({
      id: p.id.toString(),
      lat: Number(p.lokasi_pemancar!.latitude),
      lng: Number(p.lokasi_pemancar!.longitude),
      nama: p.stasiun_radio?.nama_penyelenggara || 'Unknown',
      jenis: p.stasiun_radio?.jenis_komunikasi || 'Lainnya',
      kota: p.locations?.kota || 'Unknown',
      provinsi: p.locations?.provinsi || 'Unknown'
    }));

  return (
    <div className="h-full w-full relative">
      <FloatingFilter 
        jenisList={jenisList} 
        provinsiList={provinsis.map(p => p.provinsi)}
        locations={locations} 
        defaultJenis={resolvedParams.jenis || ""} 
        defaultProvinsi={resolvedParams.provinsi || ""}
        defaultKota={resolvedParams.kota || ""} 
      />
      <MapWrapper markers={markers} />
    </div>
  );
}
