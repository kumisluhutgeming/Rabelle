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
    <div className="p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in-up">
        <header className="flex items-baseline justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Ringkasan</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Intelijen infrastruktur telekomunikasi nasional.</p>
          </div>
        </header>

        {/* 4 Stat Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="surface-card p-5 flex flex-col justify-between h-32 hover:border-primary/20 transition-all group">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Infrastruktur</p>
            <div className="flex items-end justify-between">
              <h3 className="text-5xl font-black text-foreground tracking-tighter leading-none">{total.toLocaleString()}</h3>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Aktif</span>
            </div>
          </div>

          <div className="surface-card p-5 flex flex-col justify-between h-32 hover:border-primary/20 transition-all group">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Telekomunikasi / BTS</p>
            <h3 className="text-5xl font-black text-foreground tracking-tighter leading-none">{btsCount.toLocaleString()}</h3>
          </div>

          <div className="surface-card p-5 flex flex-col justify-between h-32 hover:border-primary/20 transition-all group">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stasiun Televisi</p>
            <h3 className="text-5xl font-black text-foreground tracking-tighter leading-none">{tvCount.toLocaleString()}</h3>
          </div>

          <div className="surface-card p-5 flex flex-col justify-between h-32 hover:border-primary/20 transition-all group">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stasiun Radio</p>
            <h3 className="text-5xl font-black text-foreground tracking-tighter leading-none">{radioCount.toLocaleString()}</h3>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-4 gap-4">
          <div className="surface-card p-6 lg:col-span-1">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6 opacity-60">Komposisi Menara</h2>
            <DashboardChart data={[btsCount, tvCount, radioCount, lainnyaCount]} />
          </div>

          <div className="surface-card p-6 lg:col-span-1">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6 opacity-60">Operator Utama</h2>
            <OperatorDoughnutChart data={operatorData} labels={operatorLabels} />
          </div>

          <div className="surface-card p-6 lg:col-span-2">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6 opacity-60">Persebaran Provinsi (Top 10)</h2>
            <ProvinceBarChart data={provData} labels={provLabels} />
          </div>
        </div>
      </div>
    </div>
  );
}
