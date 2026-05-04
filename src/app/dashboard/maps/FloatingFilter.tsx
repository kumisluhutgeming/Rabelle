"use client";

import { useIdle } from "../IdleProvider";

export default function FloatingFilter({ 
  jenisList, 
  provinsiList,
  locations, 
  defaultJenis, 
  defaultProvinsi,
  defaultKota 
}: { 
  jenisList: any[];
  provinsiList: any[];
  locations: any[];
  defaultJenis: string;
  defaultProvinsi: string;
  defaultKota: string;
}) {
  const { isUiVisible, setHoverState, isSidebarCollapsed } = useIdle();
  const leftClass = isSidebarCollapsed ? "left-24" : "left-76";

  return (
    <div 
      className={`absolute top-4 ${leftClass} z-[400] transition-all duration-500 ease-in-out ${!isUiVisible ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      <form className="flex flex-col gap-3 bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.12)] rounded-2xl p-4 w-[280px]">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Jenis Komunikasi</label>
          <select name="jenis" defaultValue={defaultJenis} className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition-all cursor-pointer">
            <option value="">Semua Jenis</option>
            {jenisList
              .filter(j => j.jenis_komunikasi)
              .map(j => j.jenis_komunikasi!)
              .sort((a, b) => {
                if (a.toLowerCase() === 'lainnya') return 1;
                if (b.toLowerCase() === 'lainnya') return -1;
                return a.localeCompare(b);
              })
              .map((jenis, i) => (
                <option key={i} value={jenis}>{jenis}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Provinsi</label>
          <select name="provinsi" defaultValue={defaultProvinsi} className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition-all cursor-pointer">
            <option value="">Semua Provinsi</option>
            {provinsiList.filter(Boolean).map((prov, i) => (
              <option key={`prov-${i}`} value={prov}>{prov}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kabupaten/Kota</label>
          <select name="kota" defaultValue={defaultKota} className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition-all cursor-pointer">
            <option value="">Semua Wilayah</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.kota}>{loc.kota}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="w-full bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm mt-1">
          Terapkan Filter
        </button>
      </form>

      {/* Signal Checker Button */}
      <button 
        onClick={() => window.dispatchEvent(new Event('checkSignal'))}
        className="mt-3 w-full bg-indigo-500 text-white px-4 py-2.5 rounded-2xl text-sm font-bold shadow-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        Cek Sinyal Saya
      </button>
    </div>
  );
}
