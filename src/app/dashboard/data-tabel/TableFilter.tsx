"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function TableFilter({ 
  jenisList, 
  provinsis, 
  locations,
  defaultJenis,
  defaultProvinsi,
  defaultKota
}: { 
  jenisList: { jenis_komunikasi: string | null }[]; 
  provinsis: { provinsi: string | null }[]; 
  locations: { id: bigint; kota: string; provinsi: string | null }[];
  defaultJenis: string;
  defaultProvinsi: string;
  defaultKota: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    const name = e.target.name;
    const value = e.target.value;
    
    if (value) {
      current.set(name, value);
    } else {
      current.delete(name);
    }
    
    // reset page to 1 when filter changes if page exists in searchParams
    current.delete('page');

    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Filter Jenis Komunikasi</label>
        <select 
          name="jenis" 
          value={defaultJenis} 
          onChange={handleFilterChange}
          className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition-all cursor-pointer"
        >
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
      <div className="flex-1">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Filter Provinsi</label>
        <select 
          name="provinsi" 
          value={defaultProvinsi} 
          onChange={handleFilterChange}
          className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition-all cursor-pointer"
        >
          <option value="">Semua Provinsi</option>
          {provinsis.filter(p => p.provinsi).map((prov, i) => (
            <option key={`prov-${i}`} value={prov.provinsi!}>{prov.provinsi}</option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Filter Kabupaten/Kota</label>
        <select 
          name="kota" 
          value={defaultKota} 
          onChange={handleFilterChange}
          className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition-all cursor-pointer"
        >
          <option value="">Semua Wilayah</option>
          {locations.map((loc) => (
            <option key={loc.id.toString()} value={loc.kota}>{loc.kota}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
