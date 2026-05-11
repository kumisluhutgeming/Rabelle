"use client";

import { useState, useEffect } from "react";
import { useIdle } from "../IdleProvider";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ChevronLeft, ChevronRight, MapPin, Radio, Globe, Navigation, Search, CheckCircle2, SlidersHorizontal, ChevronDown } from "lucide-react";

// Smart Dropbar (Searchable Select) Component
function SearchableSelect({ 
  name, 
  value, 
  options, 
  placeholder, 
  onChange 
}: { 
  name: string, 
  value: string, 
  options: string[], 
  placeholder: string, 
  onChange: (name: string, value: string) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || "");

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (e.target.value === "") {
              onChange(name, ""); // Allow clearing
            }
          }}
          className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg pl-3 pr-8 py-2 text-[10px] font-bold focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-sm outline-none"
        />
        <ChevronDown size={12} className="absolute right-2.5 text-slate-400 pointer-events-none" />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-40 overflow-y-auto hide-scrollbar"
          >
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-[10px] text-slate-500 text-center font-medium">Tidak ditemukan</div>
            ) : (
              filteredOptions.map((opt, i) => (
                <div
                  key={i}
                  className="px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                  onMouseDown={(e) => {
                    // Use onMouseDown instead of onClick to fire before onBlur of input
                    e.preventDefault();
                    setQuery(opt);
                    onChange(name, opt);
                    setIsOpen(false);
                  }}
                >
                  {opt}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
    handleFilterChangeValue(e.target.name, e.target.value);
  };

  const handleFilterChangeValue = (name: string, value: string) => {
    const current = new URLSearchParams(searchParams.toString());
    if (value) current.set(name, value);
    else current.delete(name);
    if (name === "jenis") current.delete("operator");
    if (name === "provinsi") current.delete("kota");

    // Smart Auto-fill: If city is selected, auto-select its province
    if (name === "kota" && value) {
      const selectedLoc = locations.find(loc => loc.kota === value);
      if (selectedLoc && selectedLoc.provinsi) {
        current.set("provinsi", selectedLoc.provinsi);
      }
    }
    current.delete('page');
    router.push(`${pathname}?${current.toString()}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const removeFilter = (name: string) => {
    const current = new URLSearchParams(searchParams.toString());
    current.delete(name);
    // Cascade deletions
    if (name === "jenis") current.delete("operator");
    if (name === "provinsi") current.delete("kota");
    current.delete('page');
    router.push(`${pathname}?${current.toString()}`);
  };

  // Improved positioning: closer to sidebar but not covered
  const leftOffset = isSidebarCollapsed ? "left-[90px]" : "left-[298px]";

  return (
    <>
      <div 
        className={`absolute top-6 ${leftOffset} z-[1200] transition-all duration-500 ease-out ${!isUiVisible ? "opacity-0 -translate-x-4 pointer-events-none" : "opacity-100 translate-x-0"}`}
        onMouseEnter={() => setHoverState && setHoverState(true)}
        onMouseLeave={() => setHoverState && setHoverState(false)}
      >
      <motion.div 
        transition={{ type: "tween", duration: 0.2 }}
        className="relative"
      >
        <div className={`liquid-glass shadow-xl overflow-hidden transition-all duration-500 ${isExpanded ? "w-[280px] rounded-2xl" : "w-[50px] h-[50px] rounded-[20px]"}`}>
          <AnimatePresence mode="wait">
            {!isExpanded ? (
              <motion.button 
                key="shrunk"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsExpanded(true)}
                className="w-full h-full flex items-center justify-center hover:bg-white/40 transition-colors"
                title="Buka Filter Peta"
              >
                <div className="relative">
                  <SlidersHorizontal size={20} className="text-indigo-600" />
                  {(defaultJenis || defaultProvinsi || defaultKota || defaultOperator) && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />
                  )}
                </div>
              </motion.button>
            ) : (
              <motion.div 
                key="expanded"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="p-5 space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-800 text-sm tracking-tight">Filter Peta</h3>
                    {(defaultJenis || defaultProvinsi || defaultKota || defaultOperator) && (
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" title="Filter Sedang Aktif" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(defaultJenis || defaultProvinsi || defaultKota || defaultOperator) && (
                      <button onClick={clearFilters} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-all" title="Hapus Semua Filter">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    )}
                    <button onClick={() => setIsExpanded(false)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all" title="Tutup Filter">
                      <ChevronLeft size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Category */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 px-1 opacity-80">
                      <Radio size={12} className="text-indigo-600" />
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Infrastruktur</label>
                    </div>
                    <select name="jenis" value={defaultJenis} onChange={handleFilterChange} className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all cursor-pointer appearance-none shadow-sm">
                      <option value="">Semua Kategori</option>
                      {jenisList.filter(j => j.jenis_komunikasi).map(j => j.jenis_komunikasi!).sort().map((jenis, i) => (
                        <option key={i} value={jenis}>{jenis}</option>
                      ))}
                    </select>
                  </div>

                  {/* Operator */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 px-1 opacity-80">
                      <Globe size={12} className="text-emerald-600" />
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Operator</label>
                    </div>
                    <select name="operator" value={defaultOperator} onChange={handleFilterChange} className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all cursor-pointer appearance-none shadow-sm">
                      <option value="">Semua Operator</option>
                      {filteredOperators.filter(Boolean).map((op, i) => (
                        <option key={`op-${i}`} value={op}>{op}</option>
                      ))}
                    </select>
                  </div>

                  {/* Region Group */}
                  <div className="space-y-2 p-3 bg-slate-50/80 rounded-[20px] border border-slate-200/60">
                    <div className="flex items-center gap-2 mb-0.5 px-1 opacity-80">
                      <MapPin size={12} className="text-rose-600" />
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Wilayah</label>
                    </div>
                    <SearchableSelect
                      name="provinsi"
                      value={defaultProvinsi}
                      placeholder="Ketik/Pilih Provinsi..."
                      options={provinsiList.filter(Boolean)}
                      onChange={handleFilterChangeValue}
                    />
                    <SearchableSelect
                      name="kota"
                      value={defaultKota}
                      placeholder="Ketik/Pilih Kab/Kota..."
                      options={filteredCities.map(l => l.kota)}
                      onChange={handleFilterChangeValue}
                    />
                  </div>
                </div>

                <button 
                  onClick={() => window.dispatchEvent(new Event('checkSignal'))}
                  className="w-full bg-indigo-600 text-white px-4 py-3 rounded-xl text-[11px] font-black shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
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

      {/* Active Filter Badges (Idea 3) */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[1200] flex flex-wrap justify-center items-center gap-2 transition-all duration-500 ease-out pointer-events-none ${!isUiVisible ? "opacity-0 -translate-y-4" : "opacity-100 translate-y-0"}`}>
        <AnimatePresence>
          {defaultJenis && (
            <motion.div key="badge-jenis" initial={{ opacity: 0, y: -10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="liquid-glass pointer-events-auto flex items-center gap-2 px-3 py-1.5 shadow-lg border-none">
              <Radio size={12} className="text-indigo-500" />
              <span className="text-[10px] font-black text-slate-700">{defaultJenis}</span>
              <button onClick={() => removeFilter('jenis')} className="ml-1 w-4 h-4 flex items-center justify-center bg-slate-200/50 hover:bg-rose-500 text-slate-500 hover:text-white rounded-full transition-colors"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </motion.div>
          )}
          {defaultOperator && (
            <motion.div key="badge-operator" initial={{ opacity: 0, y: -10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="liquid-glass pointer-events-auto flex items-center gap-2 px-3 py-1.5 shadow-lg border-none">
              <Globe size={12} className="text-emerald-500" />
              <span className="text-[10px] font-black text-slate-700">{defaultOperator}</span>
              <button onClick={() => removeFilter('operator')} className="ml-1 w-4 h-4 flex items-center justify-center bg-slate-200/50 hover:bg-rose-500 text-slate-500 hover:text-white rounded-full transition-colors"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </motion.div>
          )}
          {defaultProvinsi && (
            <motion.div key="badge-provinsi" initial={{ opacity: 0, y: -10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="liquid-glass pointer-events-auto flex items-center gap-2 px-3 py-1.5 shadow-lg border-none">
              <MapPin size={12} className="text-rose-500" />
              <span className="text-[10px] font-black text-slate-700">{defaultProvinsi}</span>
              <button onClick={() => removeFilter('provinsi')} className="ml-1 w-4 h-4 flex items-center justify-center bg-slate-200/50 hover:bg-rose-500 text-slate-500 hover:text-white rounded-full transition-colors"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </motion.div>
          )}
          {defaultKota && (
            <motion.div key="badge-kota" initial={{ opacity: 0, y: -10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="liquid-glass pointer-events-auto flex items-center gap-2 px-3 py-1.5 shadow-lg border-none">
              <MapPin size={12} className="text-rose-600" />
              <span className="text-[10px] font-black text-slate-700">{defaultKota}</span>
              <button onClick={() => removeFilter('kota')} className="ml-1 w-4 h-4 flex items-center justify-center bg-slate-200/50 hover:bg-rose-500 text-slate-500 hover:text-white rounded-full transition-colors"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
