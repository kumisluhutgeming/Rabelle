import prisma from "@/lib/prisma";
import Link from "next/link";
import ActionButtons from "./ActionButtons";
import TableFilter from "./TableFilter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EXCLUDED_JENIS } from "@/lib/constants";
import ExportButton from "./ExportButton";
import Pagination from "./Pagination";

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
    <div className="p-4">
      <div className="max-w-6xl mx-auto space-y-4 animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
        <div>
          <h1 className="text-xl font-bold text-[#1d1d1f] tracking-tight">Data Infrastruktur</h1>
          <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-widest font-bold">Daftar lengkap menara komunikasi dan stasiun radio</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {session ? (
            <ExportButton params={resolvedParams} />
          ) : (
            <Link href="/login" className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              Login untuk Unduh
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-[20px] border border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[20px] p-4">
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

        <div className="overflow-x-auto rounded-lg border border-slate-200 relative scrollbar-thin scrollbar-thumb-slate-300">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/90 text-slate-900 font-black border-b border-slate-200 sticky top-0 z-10 shadow-sm backdrop-blur-md uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5">No</th>
                <th className="px-4 py-2.5">Nama Operator</th>
                <th className="px-4 py-2.5">Jenis Komunikasi</th>
                <th className="px-4 py-2.5">Kabupaten/Kota</th>
                <th className="px-4 py-2.5">Koordinat</th>
                {session?.user?.isAdmin && (
                  <th className="px-4 py-2.5 text-center">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pengukuranList.length > 0 ? pengukuranList.map((item, index) => (
                <tr key={item.id.toString()} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-2 text-slate-900 font-bold">{skip + index + 1}</td>
                  <td className="px-4 py-2 font-black text-black">{item.stasiun_radio?.nama_penyelenggara || '-'}</td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-tighter">
                      {item.stasiun_radio?.jenis_komunikasi || 'Lainnya'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-900">
                    <div className="font-black text-[11px] leading-tight">{item.locations?.provinsi || '-'}</div>
                    <div className="text-[10px] text-slate-600 font-black leading-tight uppercase opacity-80">{item.locations?.kota || '-'}</div>
                  </td>
                  <td className="px-4 py-2 text-slate-900 font-mono text-[10px] font-bold">
                    {item.lokasi_pemancar?.latitude?.toString() || '-'}, {item.lokasi_pemancar?.longitude?.toString() || '-'}
                  </td>
                  {session?.user?.isAdmin && (
                    <td className="px-4 py-2 text-center">
                      <ActionButtons id={item.id.toString()} />
                    </td>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={session?.user?.isAdmin ? 6 : 5} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <Pagination 
            totalPages={totalPages} 
            currentPage={page} 
            params={resolvedParams} 
          />
        )}
      </div>
      </div>
    </div>
  );
}
