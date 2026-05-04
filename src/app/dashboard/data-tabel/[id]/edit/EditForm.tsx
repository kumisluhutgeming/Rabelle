"use client";

import { useState, useEffect } from "react";
import { updateTowerData } from "./actions";
import { CheckCircle2, AlertCircle, Loader2, Search, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { PROVINSI_LIST } from "@/lib/constants";

interface InitialData {
  id: string;
  operator: string;
  jenis: string;
  provinsi: string;
  kota: string;
  lat: string;
  lng: string;
}

export default function EditForm({ initialData }: { initialData: InitialData }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form States
  const [lat, setLat] = useState(initialData.lat);
  const [lng, setLng] = useState(initialData.lng);
  const [operator, setOperator] = useState(initialData.operator);
  const [provinsi, setProvinsi] = useState(initialData.provinsi);
  const [kota, setKota] = useState(initialData.kota);
  const [jenis, setJenis] = useState(initialData.jenis);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [kotaSuggestions, setKotaSuggestions] = useState<string[]>([]);
  const [showKotaSuggestions, setShowKotaSuggestions] = useState(false);


  // Fetch Autocomplete Operator
  useEffect(() => {
    if (operator.length > 0 && operator !== initialData.operator) {
      const timeoutId = setTimeout(async () => {
        try {
          const res = await fetch(`/api/operators?q=${encodeURIComponent(operator)}`);
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data);
            setShowSuggestions(data.length > 0 && !data.includes(operator));
          }
        } catch (e) {}
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [operator, initialData.operator]);

  // Fetch Autocomplete Kota
  useEffect(() => {
    if (kota.length > 0 && kota !== initialData.kota) {
      const timeoutId = setTimeout(async () => {
        try {
          const res = await fetch(`/api/kota?q=${encodeURIComponent(kota)}&p=${encodeURIComponent(provinsi)}`);
          if (res.ok) {
            const data = await res.json();
            setKotaSuggestions(data);
            setShowKotaSuggestions(data.length > 0 && !data.includes(kota));
          }
        } catch (e) {}
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setKotaSuggestions([]);
      setShowKotaSuggestions(false);
    }
  }, [kota, provinsi, initialData.kota]);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setResult(null);
    try {
      const res = await updateTowerData(initialData.id, formData);
      setResult(res);
      if (res.success) {
        setTimeout(() => {
          router.push("/dashboard/data-tabel");
        }, 1500);
      }
    } catch (error: any) {
      setResult({ success: false, message: "Terjadi kesalahan sistem." });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form action={handleSubmit} className="p-6 space-y-6">
      {/* GPS Coordinates Group */}
      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <MapPin size={16} className="text-indigo-500" /> Titik Koordinat Lokasi
        </h3>
        <div className="flex gap-4">
          <div className="flex-1 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600">Latitude <span className="text-red-500">*</span></label>
            <input type="text" name="lat" required value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-6.123456" className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-mono bg-white" />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600">Longitude <span className="text-red-500">*</span></label>
            <input type="text" name="lng" required value={lng} onChange={(e) => setLng(e.target.value)} placeholder="106.123456" className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-mono bg-white" />
          </div>
        </div>
      </div>

      {/* Data Menara */}
      <div className="space-y-4">
        <div className="space-y-2 relative">
          <label className="block text-sm font-semibold text-slate-700">Nama Operator <span className="text-red-500">*</span></label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              name="operator" 
              required 
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Contoh: Telkomsel"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
            />
          </div>
          {/* Autocomplete Dropdown */}
          {showSuggestions && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              {suggestions.map((s, idx) => (
                <div 
                  key={idx} 
                  onClick={() => { setOperator(s); setShowSuggestions(false); }}
                  className="px-4 py-2.5 text-sm hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Jenis Komunikasi <span className="text-red-500">*</span></label>
            <select name="jenis" required value={jenis} onChange={(e) => setJenis(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm bg-white">
              <option value="BTS">BTS</option>
              <option value="TV">TV</option>
              <option value="Radio">Radio</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div className="flex-1 space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Provinsi <span className="text-red-500">*</span></label>
            <select 
              name="provinsi" 
              required 
              value={provinsi}
              onChange={(e) => setProvinsi(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm bg-white"
            >
              {PROVINSI_LIST.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2 relative">
          <label className="block text-sm font-semibold text-slate-700">Kabupaten/Kota <span className="text-red-500">*</span></label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              name="kota" 
              required 
              value={kota}
              onChange={(e) => setKota(e.target.value)}
              onFocus={() => { if(kotaSuggestions.length > 0) setShowKotaSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowKotaSuggestions(false), 200)}
              placeholder="Contoh: Jakarta Selatan"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
            />
          </div>
          {/* Autocomplete Dropdown Kota */}
          {showKotaSuggestions && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              {kotaSuggestions.map((s, idx) => (
                <div 
                  key={idx} 
                  onClick={() => { setKota(s); setShowKotaSuggestions(false); }}
                  className="px-4 py-2.5 text-sm hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className={`p-4 rounded-xl flex items-start gap-3 ${result.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {result.success ? <CheckCircle2 className="shrink-0 mt-0.5" size={20} /> : <AlertCircle className="shrink-0 mt-0.5" size={20} />}
          <div className="text-sm font-medium leading-relaxed">{result.message}</div>
        </div>
      )}

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button 
          type="submit" 
          disabled={isPending}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center gap-2"
        >
          {isPending ? <><Loader2 className="animate-spin" size={18} /> Menyimpan...</> : <><CheckCircle2 size={18} /> Simpan Perubahan</>}
        </button>
      </div>
    </form>
  );
}
