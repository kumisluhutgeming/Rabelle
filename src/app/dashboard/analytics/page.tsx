import prisma from "@/lib/prisma";
import { EXCLUDED_JENIS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const measurements = await prisma.pengukuran.findMany({
    include: {
      stasiun_radio: {
        include: { locations: true }
      },
      locations: true,
      lokasi_pemancar: {
        include: { locations: true }
      }
    }
  });

  // 1. By Jenis Komunikasi
  const byJenisMap: Record<string, number> = {};
  // 2. By Operator
  const byOperatorMap: Record<string, number> = {};
  // 3. By Provinsi
  const byProvinsiMap: Record<string, number> = {};
  // 4. By Kab/Kota
  const byKotaMap: Record<string, number> = {};

  // Clean province city map fallback for unmatched records
  const PROV_CITY_FALLBACK: Record<string, string[]> = {
    "Jawa Barat": [
      "bandung", "ciamis", "depok", "cirebon", "cimahi", "bojongsoang", 
      "dayeuhkolot", "sumedang", "kuningan", "bekasi", "cileungsi", 
      "gunung putri", "majalengka", "indramayu", "nanggung", "banjar", 
      "sukabumi", "bogor", "karawang", "cileunyi", "cibinong", 
      "tasikmalaya", "cijulang", "soreang", "cianjur", "subang", "purwakarta",
      "garut", "pangandaran"
    ],
    "DKI Jakarta": ["jakarta"],
    "Banten": ["tangerang", "serang", "cilegon", "pandeglang", "lebak"],
    "Jawa Tengah": ["semarang", "surakarta", "solo", "magelang", "pekalongan", "tegal", "cilacap", "banyumas", "purwokerto", "purbalingga", "banjarnegara", "kebumen", "purworejo", "wonosobo", "boyolali", "klaten", "sukoharjo", "wonogiri", "karanganyar", "sragen", "grobogan", "blora", "rembang", "pati", "kudus", "jepara", "demak", "temanggung", "kendal", "batang", "pemalang", "brebes"],
    "Jawa Timur": ["surabaya", "malang", "batu", "blitar", "kediri", "madiun", "mojokerto", "pasuruan", "probolinggo", "pacitan", "ponorogo", "trenggalek", "tulungagung", "lumpur", "sidoarjo", "gresik", "lamongan", "tuban", "bojonegoro", "ngawi", "magetan", "nganjuk", "jombang", "sampang", "pamekasan", "sumenep", "bangkalan", "situbondo", "bondowoso", "banyuwangi", "jember", "lumajang"],
    "DI Jogja": ["jogja", "yogyakarta", "sleman", "bantul", "gunungkidul", "kulon progo"],
    "Bali": ["denpasar", "badung", "gianyar", "buleleng", "tabanan", "jembrana", "karangasem", "klungkung"]
  };

  measurements.forEach(p => {
    let jenis = p.stasiun_radio?.jenis_komunikasi;
    if (jenis && !EXCLUDED_JENIS.includes(jenis)) {
      const trimmed = jenis.trim();
      const lower = trimmed.toLowerCase();
      if (lower === "tv") {
        jenis = "TV";
      } else if (lower === "bts" || lower === "telekomunikasi/seluler") {
        jenis = "Telekomunikasi/Seluler";
      } else if (lower === "radio") {
        jenis = "Radio";
      } else if (lower.includes("5g")) {
        jenis = "Telekomunikasi/Seluler 5G";
      } else if (lower.includes("4g")) {
        jenis = "Telekomunikasi/Seluler 4G";
      }
      byJenisMap[jenis] = (byJenisMap[jenis] || 0) + 1;
    }

    let op = p.stasiun_radio?.nama_penyelenggara;
    if (op) {
      // Normalize 'Communication' and 'communication'
      if (op.toLowerCase() === "communication") {
        op = "Communication";
      }
      byOperatorMap[op] = (byOperatorMap[op] || 0) + 1;
    }

    // Comprehensive multi-level fallback for province and city matching
    let prov = p.locations?.provinsi || p.stasiun_radio?.locations?.provinsi || p.lokasi_pemancar?.locations?.provinsi;
    let kota = p.locations?.kota || p.stasiun_radio?.locations?.kota || p.lokasi_pemancar?.locations?.kota;

    // Direct mapping fallback for cities with null province in db
    if ((!prov || prov === "null") && kota) {
      const lowerKota = kota.toLowerCase();
      for (const [pName, cities] of Object.entries(PROV_CITY_FALLBACK)) {
        if (cities.some(c => lowerKota.includes(c))) {
          prov = pName;
          break;
        }
      }
    }

    if (prov) {
      let normProv = prov.trim();
      const lower = normProv.toLowerCase();
      if (lower === "jawa barat" || lower === "jabar" || lower.includes("jawa barat")) {
        normProv = "Jawa Barat";
      } else if (lower === "dki jakarta" || lower.includes("jakarta")) {
        normProv = "DKI Jakarta";
      } else if (lower === "di jogja" || lower === "yogyakarta") {
        normProv = "DI Jogja";
      } else if (lower === "banten") {
        normProv = "Banten";
      } else if (lower === "jawa tengah" || lower.includes("tengah")) {
        normProv = "Jawa Tengah";
      } else if (lower === "jawa timur" || lower.includes("timur")) {
        normProv = "Jawa Timur";
      } else if (lower === "bali") {
        normProv = "Bali";
      }
      byProvinsiMap[normProv] = (byProvinsiMap[normProv] || 0) + 1;
    }

    if (kota) {
      byKotaMap[kota] = (byKotaMap[kota] || 0) + 1;
    }
  });

  // Convert to sorted arrays
  const byJenis = Object.entries(byJenisMap)
    .map(([jenis, count]) => ({ jenis, count }))
    .sort((a, b) => b.count - a.count);

  const byOperator = Object.entries(byOperatorMap)
    .map(([operator, count]) => ({ operator, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const byProvinsi = Object.entries(byProvinsiMap)
    .map(([provinsi, count]) => ({ provinsi, count }))
    .sort((a, b) => b.count - a.count);

  const byKota = Object.entries(byKotaMap)
    .map(([kota, count]) => ({ kota, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#1d1d1f] tracking-tight">Analitik Tren & Sebaran</h1>
          <p className="text-gray-500 mt-1">Metrik distribusi dan performa infrastruktur telekomunikasi secara komprehensif</p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: Jenis Komunikasi */}
          <div className="bg-white/70 backdrop-blur-[20px] border border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[24px] p-6 hover:shadow-lg transition-all">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
              <span>Distribusi Jenis Komunikasi</span>
              <span className="text-xs bg-sky-50 text-sky-600 px-2 py-1 rounded font-normal">Tipe Menara</span>
            </h3>
            <div className="space-y-4">
              {byJenis.map((item, idx) => {
                const totalJenis = byJenis.reduce((acc, i) => acc + i.count, 0);
                const percentage = Math.max(2, (item.count / (totalJenis || 1)) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm text-slate-600 font-medium">
                      <span>{item.jenis || "Lainnya"}</span>
                      <span className="font-bold text-slate-800">{item.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-sky-500 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Top Operators */}
          <div className="bg-white/70 backdrop-blur-[20px] border border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[24px] p-6 hover:shadow-lg transition-all">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
              <span>Penyelenggara Teratas (Top Operators)</span>
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-normal">Pemilik</span>
            </h3>
            <div className="space-y-4">
              {byOperator.map((item, idx) => {
                const totalOps = byOperator.reduce((acc, i) => acc + i.count, 0);
                const percentage = Math.max(2, (item.count / (totalOps || 1)) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm text-slate-600 font-medium">
                      <span className="truncate max-w-[220px]">{item.operator}</span>
                      <span className="font-bold text-slate-800">{item.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-indigo-500 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Provinsi */}
          <div className="bg-white/70 backdrop-blur-[20px] border border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[24px] p-6 hover:shadow-lg transition-all">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
              <span>Persebaran Wilayah Provinsi</span>
              <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-normal">Region</span>
            </h3>
            <div className="space-y-4">
              {byProvinsi.map((item, idx) => {
                const totalProv = byProvinsi.reduce((acc, i) => acc + i.count, 0);
                const percentage = Math.max(2, (item.count / (totalProv || 1)) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm text-slate-600 font-medium">
                      <span>{item.provinsi || "Lainnya"}</span>
                      <span className="font-bold text-slate-800">{item.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Kab/Kota */}
          <div className="bg-white/70 backdrop-blur-[20px] border border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[24px] p-6 hover:shadow-lg transition-all">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
              <span>Kabupaten & Kota Terbanyak</span>
              <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded font-normal">Kota</span>
            </h3>
            <div className="space-y-4">
              {byKota.map((item, idx) => {
                const totalKota = byKota.reduce((acc, i) => acc + i.count, 0);
                const percentage = Math.max(2, (item.count / (totalKota || 1)) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm text-slate-600 font-medium">
                      <span>{item.kota || "Lainnya"}</span>
                      <span className="font-bold text-slate-800">{item.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-orange-500 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
