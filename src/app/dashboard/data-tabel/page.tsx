import prisma from "@/lib/prisma";
import Link from "next/link";
import ActionButtons from "./ActionButtons";
import TableFilter from "./TableFilter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EXCLUDED_JENIS } from "@/lib/constants";
import ExportButton from "./ExportButton";
import Pagination from "./Pagination";
import CoordinateCell from "./CoordinateCell";

export const dynamic = "force-dynamic";

export default async function DataTabelPage({
  searchParams
}: {
  searchParams: Promise<{ jenis?: string; provinsi?: string; kota?: string; operator?: string; page?: string; search?: string }>
}) {
  const session = await getServerSession(authOptions);
  const resolvedParams = await searchParams;

  const page = parseInt(resolvedParams.page || "1");
  const limit = 10;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};
  
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
    where.locations = { ...where.locations, provinsi: resolvedParams.provinsi };
  }

  if (resolvedParams.kota) {
    where.locations = { ...where.locations, kota: resolvedParams.kota };
  }

  if (resolvedParams.search) {
    const search = resolvedParams.search;
    where.OR = [
      { stasiun_radio: { nama_penyelenggara: { contains: search } } },
      { locations: { kota: { contains: search } } },
      { locations: { provinsi: { contains: search } } },
      { stasiun_radio: { jenis_komunikasi: { contains: search } } }
    ];
  }

  const [totalItems, pengukuranList, locations, provinsis, jenisList, operatorList] = await Promise.all([
    prisma.pengukuran.count({ where }),
    prisma.pengukuran.findMany({
      where,
      skip,
      take: limit,
      include: {
        stasiun_radio: true,
        locations: true,
        lokasi_pemancar: true
      }
    }),
    prisma.locations.findMany({
      select: { id: true, kota: true, provinsi: true },
      distinct: ['kota'],
      take: 500
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
      take: 1500,
      distinct: ['nama_penyelenggara', 'jenis_komunikasi']
    })
  ]);

  // Build grouped map: { jenis -> string[] }
  const operatorsByJenis: Record<string, string[]> = {};
  for (const row of operatorList) {
    const jenis = row.jenis_komunikasi || 'Lainnya';
    if (!operatorsByJenis[jenis]) operatorsByJenis[jenis] = [];
    if (!operatorsByJenis[jenis].includes(row.nama_penyelenggara)) {
      operatorsByJenis[jenis].push(row.nama_penyelenggara);
    }
  }

  const totalPages = Math.ceil(totalItems / limit);

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in-up">
        <header className="flex items-baseline justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Katalog Data</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Registri infrastruktur telekomunikasi nasional.</p>
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <ExportButton params={resolvedParams} />
            ) : (
              <Link href="/login" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-[10px] transition-all hover:opacity-90 shadow-sm flex items-center gap-2 uppercase tracking-widest">
                Login untuk Unduh
              </Link>
            )}
          </div>
        </header>

        <div className="surface-card p-6 space-y-6">
          <TableFilter 
            jenisList={jenisList} 
            provinsis={provinsis} 
            locations={locations}
            operatorsByJenis={operatorsByJenis}
            defaultJenis={resolvedParams.jenis || ""}
            defaultProvinsi={resolvedParams.provinsi || ""}
            defaultKota={resolvedParams.kota || ""}
            defaultOperator={resolvedParams.operator || ""}
            defaultSearch={resolvedParams.search || ""}
          />

          <div className="overflow-x-auto rounded-xl border border-border bg-background/50">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted text-muted-foreground font-bold border-b border-border uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Operator</th>
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3">Wilayah</th>
                  <th className="px-4 py-3">Koordinat</th>
                  {session?.user?.isAdmin && (
                    <th className="px-4 py-3 text-center">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pengukuranList.length > 0 ? pengukuranList.map((item, index) => (
                  <tr key={item.id.toString()} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground font-medium text-xs">{skip + index + 1}</td>
                    <td className="px-4 py-3 font-bold text-foreground text-base tracking-tight">{item.stasiun_radio?.nama_penyelenggara || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary text-secondary-foreground border border-border uppercase tracking-tighter">
                        {item.stasiun_radio?.jenis_komunikasi || 'Lainnya'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-xs text-foreground leading-tight">{item.locations?.provinsi || '-'}</div>
                      <div className="text-[10px] text-muted-foreground font-bold leading-tight uppercase tracking-widest mt-0.5">{item.locations?.kota || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      {item.lokasi_pemancar?.latitude && item.lokasi_pemancar?.longitude ? (
                        <CoordinateCell 
                          lat={Number(item.lokasi_pemancar.latitude)} 
                          lng={Number(item.lokasi_pemancar.longitude)}
                          latStr={item.lokasi_pemancar.latitude.toString()}
                          lngStr={item.lokasi_pemancar.longitude.toString()}
                        />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    {session?.user?.isAdmin && (
                      <td className="px-4 py-3 text-center">
                        <ActionButtons id={item.id.toString()} />
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={session?.user?.isAdmin ? 6 : 5} className="px-6 py-12 text-center text-muted-foreground text-sm font-medium">
                      Data tidak ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pt-2 flex justify-center">
              <Pagination 
                totalPages={totalPages} 
                currentPage={page} 
                params={resolvedParams} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
