"use client";

import { useState } from "react";
import { useIdle } from "../IdleProvider";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ChevronLeft, ChevronRight, MapPin, Radio, Globe, Navigation, Search, CheckCircle2, SlidersHorizontal } from "lucide-react";

export default function FloatingFilter({ 
  jenisList, 
  provinsiList,
  locations, 
  operatorsByJenis = {},
  defaultJenis, 
  defaultProvinsi,
  defaultKota,
  defaultOperator 
}: { 
  jenisList: any[];
  provinsiList: any[];
  locations: any[];
  operatorsByJenis?: Record<string, string[]>;
  defaultJenis: string;
  defaultProvinsi: string;
  defaultKota: string;
  defaultOperator: string;
}) {
  const { isUiVisible, setHoverState, isSidebarCollapsed } = useIdle();
  const [isExpanded, setIsExpanded] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const allOperators = Object.values(operatorsByJenis).flat();
  const uniqueAll = [...new Set(allOperators)].sort();
  const filteredOperators = defaultJenis ? (operatorsByJenis[defaultJenis] ?? []).slice().sort() : uniqueAll;

  // Filter cities client-side for extra safety & speed
  const filteredCities = defaultProvinsi 
    ? locations.filter(loc => loc.provinsi === defaultProvinsi).sort((a, b) => a.kota.localeCompare(b.kota))
    : locations.sort((a, b) => a.kota.localeCompare(b.kota));

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const current = new URLSearchParams(searchParams.toString());
    const name = e.target.name;
    const value = e.target.value;
    if (value) current.set(name, value);
    else current.delete(name);
    if (name === "jenis") current.delete("operator");
    if (name === "provinsi") current.delete("kota");
    current.delete('page');
    router.push(`${pathname}?${current.toString()}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  // Improved positioning: closer to sidebar but not covered
  const leftOffset = isSidebarCollapsed ? "left-[90px]" : "left-[298px]";

  return (
    <div 
      className={`absolute top-6 ${leftOffset} z-[1200] transition-all duration-500 ease-out ${!isUiVisible ? "opacity-0 -translate-x-4 pointer-events-none" : "opacity-100 translate-x-0"}`}
      onMouseEnter={() => setHoverState && setHoverState(true)}
      onMouseLeave={() => setHoverState && setHoverState(false)}
    >
      <motion.div 
        transition={{ type: "tween", duration: 0.2 }}
        className="relative"
      >
        <div className={`liquid-glass flex shadow-xl ${isExpanded ? "w-[280px]" : "w-[60px] h-[60px]"}`}>
          {/* Toggle Tab Shrunk */}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex-shrink-0 w-[60px] h-[60px] flex items-center justify-center hover:bg-white/40 transition-colors ${isExpanded ? "border-r border-white/20" : ""}`}
          >
            {isExpanded ? (
              <ChevronLeft size={20} className="text-slate-400" />
            ) : (
              <div className="relative">
                <SlidersHorizontal size={20} className="text-indigo-600" />
                {(defaultJenis || defaultProvinsi || defaultKota || defaultOperator) && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />
                )}
              </div>
            )}
          </button>

          {/* Form Content Shrunk */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 p-5 space-y-5 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-800 text-sm tracking-tight">Filter Peta</h3>
                  <div className="flex items-center gap-2">
                    {(defaultJenis || defaultProvinsi || defaultKota || defaultOperator) && (
                      <button onClick={clearFilters} className="p-1.5 bg-white/40 hover:bg-white/60 text-slate-500 rounded-lg transition-all" title="Hapus Filter">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    )}
                    <div className="px-2 py-0.5 bg-indigo-500 rounded-full flex items-center gap-1 shadow-md">
                      <span className="text-[8px] font-black text-white uppercase tracking-widest">Aktif</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Category */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 px-1">
                      <Radio size={12} className="text-indigo-500" />
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Infrastruktur</label>
                    </div>
                    <select name="jenis" value={defaultJenis} onChange={handleFilterChange} className="w-full bg-white/50 border border-white/40 text-slate-700 rounded-xl px-3 py-2.5 text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none shadow-sm">
                      <option value="">Semua Kategori</option>
                      {jenisList.filter(j => j.jenis_komunikasi).map(j => j.jenis_komunikasi!).sort().map((jenis, i) => (
                        <option key={i} value={jenis}>{jenis}</option>
                      ))}
                    </select>
                  </div>

                  {/* Operator */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 px-1">
                      <Globe size={12} className="text-emerald-500" />
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operator</label>
                    </div>
                    <select name="operator" value={defaultOperator} onChange={handleFilterChange} className="w-full bg-white/50 border border-white/40 text-slate-700 rounded-xl px-3 py-2.5 text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none shadow-sm">
                      <option value="">Semua Operator</option>
                      {filteredOperators.filter(Boolean).map((op, i) => (
                        <option key={`op-${i}`} value={op}>{op}</option>
                      ))}
                    </select>
                  </div>

                  {/* Region Group Shrunk */}
                  <div className="space-y-2 p-3 bg-white/20 rounded-[20px] border border-white/30">
                    <div className="flex items-center gap-2 mb-0.5 px-1">
                      <MapPin size={12} className="text-rose-500" />
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Wilayah</label>
                    </div>
                    <select name="provinsi" value={defaultProvinsi} onChange={handleFilterChange} className="w-full bg-white border-none text-slate-700 rounded-lg px-3 py-2 text-[10px] font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer shadow-sm">
                      <option value="">Provinsi</option>
                      {provinsiList.filter(Boolean).map((prov, i) => (
                        <option key={`prov-${i}`} value={prov}>{prov}</option>
                      ))}
                    </select>
                    <select name="kota" value={defaultKota} onChange={handleFilterChange} className="w-full bg-white border-none text-slate-700 rounded-lg px-3 py-2 text-[10px] font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer shadow-sm">
                      <option value="">Kabupaten/Kota</option>
                      {filteredCities.map((loc) => (
                        <option key={loc.id} value={loc.kota}>{loc.kota}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button 
                  onClick={() => window.dispatchEvent(new Event('checkSignal'))}
                  className="w-full bg-indigo-600 text-white px-4 py-3 rounded-xl text-[11px] font-black shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Navigation size={14} fill="white" className="rotate-45" />
                  Ukur Sinyal
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
