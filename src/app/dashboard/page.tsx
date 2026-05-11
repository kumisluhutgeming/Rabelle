import prisma from "@/lib/prisma";
import DashboardChart from "./DashboardChart";
import { ProvinceBarChart, OperatorDoughnutChart } from "./EnhancedCharts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Aggregate data based on types using Prisma
  // To avoid complex group_by issues with nullable fields, we'll fetch basic counts.
  
  const [
    btsCount,
    tvCount,
    radioCount,
    lainnyaCount,
    topOperators,
    topProvinsisRaw
  ] = await Promise.all([
    prisma.pengukuran.count({ where: { stasiun_radio: { jenis_komunikasi: 'Telekomunikasi/Seluler' } } }),
    prisma.pengukuran.count({ where: { stasiun_radio: { jenis_komunikasi: 'TV' } } }),
    prisma.pengukuran.count({ where: { stasiun_radio: { jenis_komunikasi: 'Radio' } } }),
    prisma.pengukuran.count({ where: { stasiun_radio: { jenis_komunikasi: 'Lainnya' } } }),
    prisma.stasiun_radio.groupBy({
      by: ['nama_penyelenggara'],
      _count: { _all: true },
      orderBy: { _count: { nama_penyelenggara: 'desc' } },
      take: 5,
      where: { nama_penyelenggara: { notIn: ['Pribadi', '-'] } }
    }),
    prisma.$queryRaw`
      SELECT l.provinsi, CAST(COUNT(p.id) AS UNSIGNED) as count 
      FROM pengukuran p 
      JOIN locations l ON p.location_id = l.id 
      WHERE l.provinsi IS NOT NULL AND l.provinsi != ''
      GROUP BY l.provinsi 
      ORDER BY count DESC 
      LIMIT 10
    ` as Promise<any[]>
  ]);

  const total = btsCount + tvCount + radioCount + lainnyaCount;

  // Format data for Operator Chart
  const operatorLabels = topOperators.map(op => op.nama_penyelenggara);
  const operatorData = topOperators.map(op => op._count._all);

  // Format data for Province Chart
  const provLabels = topProvinsisRaw.map((p: any) => p.provinsi);
  const provData = topProvinsisRaw.map((p: any) => Number(p.count));

  return (
    <div className="p-6">
      <div className="max-w-[1400px] mx-auto space-y-8 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Analitik</h1>
            <p className="text-slate-500 mt-1 font-medium">Intelijen Data Infrastruktur Telekomunikasi Nasional</p>
          </div>
        </div>

        {/* 4 Stat Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-2xl border border-white shadow-xl shadow-slate-200/40 rounded-[28px] p-6 flex items-center gap-5 hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-slate-900/30">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 2v20M5 6l7-4 7 4M5 12h14M7 18h10" /></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Infrastruktur</p>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none">{total.toLocaleString()}</h3>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl border border-white shadow-xl shadow-slate-200/40 rounded-[28px] p-6 flex items-center gap-5 hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-blue-500/30">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Telekomunikasi</p>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none">{btsCount.toLocaleString()}</h3>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl border border-white shadow-xl shadow-slate-200/40 rounded-[28px] p-6 flex items-center gap-5 hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-emerald-500/30">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Stasiun Televisi</p>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none">{tvCount.toLocaleString()}</h3>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl border border-white shadow-xl shadow-slate-200/40 rounded-[28px] p-6 flex items-center gap-5 hover:-translate-y-1 transition-transform">
            <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-orange-500/30">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Stasiun Radio</p>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none">{radioCount.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-2xl border border-white shadow-xl shadow-slate-200/40 rounded-[32px] p-8 lg:col-span-1">
            <h2 className="text-xs font-black text-slate-800 mb-6 uppercase tracking-widest">Komposisi Menara</h2>
            <DashboardChart data={[btsCount, tvCount, radioCount, lainnyaCount]} />
          </div>

          <div className="bg-white/80 backdrop-blur-2xl border border-white shadow-xl shadow-slate-200/40 rounded-[32px] p-8 lg:col-span-1">
            <h2 className="text-xs font-black text-slate-800 mb-6 uppercase tracking-widest">Top 5 Operator Utama</h2>
            <OperatorDoughnutChart data={operatorData} labels={operatorLabels} />
          </div>

          <div className="bg-white/80 backdrop-blur-2xl border border-white shadow-xl shadow-slate-200/40 rounded-[32px] p-8 lg:col-span-2">
            <h2 className="text-xs font-black text-slate-800 mb-6 uppercase tracking-widest">Persebaran Infrastruktur (Top 10 Provinsi)</h2>
            <ProvinceBarChart data={provData} labels={provLabels} />
          </div>
        </div>
      </div>
    </div>
  );
}
