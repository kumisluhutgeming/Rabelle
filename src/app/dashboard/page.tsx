import prisma from "@/lib/prisma";
import DashboardChart from "./DashboardChart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Aggregate data based on types using Prisma
  // To avoid complex group_by issues with nullable fields, we'll fetch basic counts.
  
  const btsCount = await prisma.pengukuran.count({
    where: { stasiun_radio: { jenis_komunikasi: 'BTS' } }
  });
  
  const tvCount = await prisma.pengukuran.count({
    where: { stasiun_radio: { jenis_komunikasi: 'TV' } }
  });
  
  const radioCount = await prisma.pengukuran.count({
    where: { stasiun_radio: { jenis_komunikasi: 'Radio' } }
  });
  
  const lainnyaCount = await prisma.pengukuran.count({
    where: { stasiun_radio: { jenis_komunikasi: 'Lainnya' } }
  });

  const total = btsCount + tvCount + radioCount + lainnyaCount;

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1d1d1f] tracking-tight">Dashboard Interaktif</h1>
          <p className="text-gray-500 mt-1">Ringkasan statistik infrastruktur telekomunikasi tahun 2026</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white/70 backdrop-blur-[20px] border border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[24px] p-8 lg:col-span-1">
          <h2 className="text-lg font-semibold text-[#1d1d1f] mb-6">Komposisi Menara</h2>
          <DashboardChart data={[btsCount, tvCount, radioCount, lainnyaCount]} />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          {/* Card Total */}
          <div className="bg-white/70 backdrop-blur-[20px] border border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[24px] p-6 flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-[#007AFF] mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Infrastruktur</p>
              <h3 className="text-4xl font-bold text-[#1d1d1f] tracking-tight">{total}</h3>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-[20px] border border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[24px] p-6 flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Base Transceiver Station</p>
              <h3 className="text-4xl font-bold text-[#1d1d1f] tracking-tight">{btsCount}</h3>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-[20px] border border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[24px] p-6 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-500 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Stasiun Televisi</p>
              <h3 className="text-3xl font-bold text-[#1d1d1f] tracking-tight">{tvCount}</h3>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-[20px] border border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[24px] p-6 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Stasiun Radio</p>
              <h3 className="text-3xl font-bold text-[#1d1d1f] tracking-tight">{radioCount}</h3>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
