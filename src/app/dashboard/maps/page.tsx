import prisma from "@/lib/prisma";
import MapWrapper from "./MapWrapper";
import FloatingFilter from "./FloatingFilter";
import { EXCLUDED_JENIS } from "@/lib/constants";
import { Suspense } from "react";

export const revalidate = 3600; // ISR: Cache for 1 hour

export default async function MapsPage({
  searchParams
}: {
  searchParams: Promise<{ jenis?: string; provinsi?: string; kota?: string; operator?: string }>
}) {
  const resolvedParams = await searchParams;

  // Build where clause
  const where: any = {};
  const locWhere: any = {};
  
  const radioWhere: any = {};
  if (resolvedParams.jenis) {
    radioWhere.jenis_komunikasi = resolvedParams.jenis;
  }
  if (resolvedParams.operator) {
    radioWhere.nama_penyelenggara = resolvedParams.operator;
  }

  if (Object.keys(radioWhere).length > 0) {
    where.stasiun_radio = radioWhere;
  }

  if (resolvedParams.provinsi) {
    locWhere.provinsi = resolvedParams.provinsi;
    where.locations = { ...where.locations, provinsi: resolvedParams.provinsi };
  }

  if (resolvedParams.kota) {
    where.locations = { ...where.locations, kota: resolvedParams.kota };
  }

  // Fetch data
  const [locations, provinsis, jenisList, allOperators] = await Promise.all([
    prisma.locations.findMany({
      where: locWhere,
      select: { id: true, kota: true, provinsi: true, latitude: true, longitude: true },
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
    }),
    prisma.stasiun_radio.findMany({
      select: { nama_penyelenggara: true, jenis_komunikasi: true },
      distinct: ['nama_penyelenggara', 'jenis_komunikasi']
    })
  ]);

  // Convert Decimals and BigInts
  const serializedLocations = locations.map(loc => ({
    ...loc,
    id: loc.id.toString(),
    latitude: loc.latitude ? Number(loc.latitude) : null,
    longitude: loc.longitude ? Number(loc.longitude) : null,
  }));

  const operatorsByJenis: Record<string, string[]> = {};
  for (const row of allOperators) {
    const jenis = row.jenis_komunikasi || 'Lainnya';
    if (!operatorsByJenis[jenis]) operatorsByJenis[jenis] = [];
    if (!operatorsByJenis[jenis].includes(row.nama_penyelenggara)) {
      operatorsByJenis[jenis].push(row.nama_penyelenggara);
    }
  }

  return (
    <div className="h-full w-full relative">
      <FloatingFilter 
        jenisList={jenisList} 
        provinsiList={provinsis.map(p => p.provinsi)}
        locations={serializedLocations} 
        operatorsByJenis={operatorsByJenis}
        defaultJenis={resolvedParams.jenis || ""} 
        defaultProvinsi={resolvedParams.provinsi || ""}
        defaultKota={resolvedParams.kota || ""} 
        defaultOperator={resolvedParams.operator || ""}
      />
      <Suspense fallback={<div className="h-full w-full flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" /></div>}>
        <MapWrapper markers={[]} locations={serializedLocations} />
      </Suspense>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
