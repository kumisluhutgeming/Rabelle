"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export default function TableFilter({ 
  jenisList, 
  provinsis, 
  locations,
  operatorsByJenis = {},
  defaultJenis,
  defaultProvinsi,
  defaultKota,
  defaultOperator,
  defaultSearch
}: { 
  jenisList: { jenis_komunikasi: string | null }[]; 
  provinsis: { provinsi: string | null }[]; 
  locations: { id: bigint; kota: string; provinsi: string | null }[];
  operatorsByJenis?: Record<string, string[]>;
  defaultJenis: string;
  defaultProvinsi: string;
  defaultKota: string;
  defaultOperator: string;
  defaultSearch: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(defaultSearch || "");

  const handleSearchCommit = () => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (searchTerm) {
      current.set("search", searchTerm);
    } else {
      current.delete("search");
    }
    current.delete('page');
    router.push(`${pathname}?${current.toString()}`);
  };
  // Compute which operators to show based on selected jenis
  const allOperators = [...new Set(Object.values(operatorsByJenis).flat())].sort();
  const filteredOperators = defaultJenis
    ? (operatorsByJenis[defaultJenis] ?? []).slice().sort()
    : allOperators;

  // Filter cities client-side for extra safety & speed
  const filteredCities = defaultProvinsi 
    ? locations.filter(loc => loc.provinsi === defaultProvinsi).sort((a, b) => a.kota.localeCompare(b.kota))
    : locations.sort((a, b) => a.kota.localeCompare(b.kota));

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    const name = e.target.name;
    const value = e.target.value;
    
    if (value) {
      current.set(name, value);
    } else {
      current.delete(name);
    }
    
    // When jenis changes, reset operator so stale selection is cleared
    if (name === "jenis") {
      current.delete("operator");
    }

    // When provinsi changes, reset kota so stale selection is cleared
    if (name === "provinsi") {
      current.delete("kota");
    }

    // Smart Auto-fill: If city is selected, auto-select its province
    if (name === "kota" && value) {
      const selectedLoc = locations.find(loc => loc.kota === value);
      if (selectedLoc && selectedLoc.provinsi) {
        current.set("provinsi", selectedLoc.provinsi);
      }
    }

    // reset page to 1 when filter changes
    current.delete('page');

    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`);
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Global Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={18} className="text-slate-400" />
        </div>
        <input 
          type="text" 
          placeholder="Pencarian Bebas: Cari ID, Nama Tower, Alamat, atau Kota..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearchCommit()}
          onBlur={handleSearchCommit}
          className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition-all shadow-sm font-medium"
        />
        {searchTerm && (
          <button 
            onClick={() => { setSearchTerm(""); setTimeout(() => handleSearchCommit(), 50); }}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-rose-500 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        )}
      </div>

      {/* Dropdown Filters */}
      <div className="flex flex-col md:flex-row gap-4">
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
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Filter Operator
          {defaultJenis && (
            <span className="ml-1 text-[#007AFF] normal-case font-normal">({filteredOperators.length})</span>
          )}
        </label>
        <select 
          name="operator" 
          value={defaultOperator} 
          onChange={handleFilterChange}
          className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition-all cursor-pointer"
        >
          <option value="">Semua Operator</option>
          {filteredOperators.filter(Boolean).map((op, i) => (
            <option key={`op-${i}`} value={op}>{op}</option>
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
          {filteredCities.map((loc) => (
            <option key={loc.id.toString()} value={loc.kota}>{loc.kota}</option>
          ))}
          </select>
        </div>
      </div>
    </div>
  );
}
