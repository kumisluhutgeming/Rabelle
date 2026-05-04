import prisma from "@/lib/prisma";
import Link from "next/link";
import ActionButtons from "./ActionButtons";
import TableFilter from "./TableFilter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EXCLUDED_JENIS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DataTabelPage({
  searchParams
}: {
  searchParams: Promise<{ jenis?: string; provinsi?: string; kota?: string; page?: string }>
}) {
  const session = await getServerSession(authOptions);
  const resolvedParams = await searchParams;

  const page = parseInt(resolvedParams.page || "1");
  const limit = 10;
  const skip = (page - 1) * limit;

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

  const [totalItems, pengukuranList, locations, provinsis, jenisList] = await Promise.all([
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

  const totalPages = Math.ceil(totalItems / limit);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1d1d1f] tracking-tight">Data Infrastruktur</h1>
          <p className="text-gray-500 mt-1">Daftar lengkap menara komunikasi dan stasiun radio</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {session ? (
            <button className="bg-[#007AFF] hover:bg-[#0066CC] text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Unduh Dataset
            </button>
          ) : (
            <Link href="/login" className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              Login untuk Unduh
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-[20px] border border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[24px] p-6">
        <TableFilter 
          jenisList={jenisList} 
          provinsis={provinsis} 
          locations={locations}
          defaultJenis={resolvedParams.jenis || ""}
          defaultProvinsi={resolvedParams.provinsi || ""}
          defaultKota={resolvedParams.kota || ""}
        />

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Nama Operator</th>
                <th className="px-6 py-4">Jenis Komunikasi</th>
                <th className="px-6 py-4">Kabupaten/Kota</th>
                <th className="px-6 py-4">Koordinat</th>
                {session?.user?.isAdmin && (
                  <th className="px-6 py-4 text-center">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pengukuranList.length > 0 ? pengukuranList.map((item, index) => (
                <tr key={item.id.toString()} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-500">{skip + index + 1}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{item.stasiun_radio?.nama_penyelenggara || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-100">
                      {item.stasiun_radio?.jenis_komunikasi || 'Lainnya'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="font-medium">{item.locations?.provinsi || '-'}</div>
                    <div className="text-xs text-slate-400">{item.locations?.kota || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                    {item.lokasi_pemancar?.latitude?.toString() || '-'}, {item.lokasi_pemancar?.longitude?.toString() || '-'}
                  </td>
                  {session?.user?.isAdmin && (
                    <td className="px-6 py-4 text-center">
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
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-slate-500">Menampilkan halaman {page} dari {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`?page=${page - 1}&jenis=${resolvedParams.jenis || ''}&provinsi=${resolvedParams.provinsi || ''}&kota=${resolvedParams.kota || ''}`} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                  Sebelumnya
                </Link>
              )}
              {page < totalPages && (
                <Link href={`?page=${page + 1}&jenis=${resolvedParams.jenis || ''}&provinsi=${resolvedParams.provinsi || ''}&kota=${resolvedParams.kota || ''}`} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                  Selanjutnya
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
