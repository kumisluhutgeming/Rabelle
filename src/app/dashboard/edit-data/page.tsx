"use client";

import { useState, useEffect, useRef } from "react";
import { uploadGeojson, saveGpsTower } from "./actions";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, MapPin, Search } from "lucide-react";

export default function EditDataPage() {
  const [activeTab, setActiveTab] = useState<'geojson' | 'gps'>('geojson');
  const [isPending, setIsPending] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // GPS Form States
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [operator, setOperator] = useState("");
  const [provinsi, setProvinsi] = useState("DKI Jakarta");
  const [kota, setKota] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [kotaSuggestions, setKotaSuggestions] = useState<string[]>([]);
  const [showKotaSuggestions, setShowKotaSuggestions] = useState(false);

  const PROVINSI_LIST = [
    "Banten", "DKI Jakarta", "Jawa Barat", "Jawa Tengah", 
    "Jawa Timur", "DI Jogja", "Bali"
  ];

  // Fetch Autocomplete Operator
  useEffect(() => {
    if (operator.length > 0) {
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
  }, [operator]);

  // Fetch Autocomplete Kota
  useEffect(() => {
    if (kota.length > 0) {
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
  }, [kota, provinsi]);

  const handleGetLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const latitude = pos.coords.latitude.toString();
          const longitude = pos.coords.longitude.toString();
          setLat(latitude);
          setLng(longitude);

          // Reverse Geocoding untuk Otomatisasi Provinsi & Kota
          try {
            const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`;
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              
              // 1. Ekstrak Kota
              let kotaName = data.city || data.locality || "";
              if (kotaName && !kotaName.toLowerCase().includes('kota') && !kotaName.toLowerCase().includes('kabupaten')) {
                kotaName = `Kota/Kab. ${kotaName}`;
              }
              if (kotaName) setKota(kotaName);

              // 2. Ekstrak Provinsi dari data administratif
              let foundProvinsi = "";
              if (data.localityInfo?.administrative) {
                for (const admin of data.localityInfo.administrative) {
                   const lowerName = admin.name.toLowerCase();
                   if (lowerName.includes('banten')) foundProvinsi = 'Banten';
                   else if (lowerName.includes('jakarta')) foundProvinsi = 'DKI Jakarta';
                   else if (lowerName.includes('jawa barat') || lowerName.includes('west java')) foundProvinsi = 'Jawa Barat';
                   else if (lowerName.includes('jawa tengah') || lowerName.includes('central java')) foundProvinsi = 'Jawa Tengah';
                   else if (lowerName.includes('jawa timur') || lowerName.includes('east java')) foundProvinsi = 'Jawa Timur';
                   else if (lowerName.includes('yogyakarta') || lowerName.includes('jogja')) foundProvinsi = 'DI Jogja';
                   else if (lowerName.includes('bali')) foundProvinsi = 'Bali';
                   
                   if (foundProvinsi) break;
                }
              }
              if (foundProvinsi) setProvinsi(foundProvinsi);
            }
          } catch(e) {
            console.error("Reverse Geocode failed", e);
          } finally {
            setIsLocating(false);
          }
        },
        () => {
          setIsLocating(false);
          alert("Gagal mendapatkan lokasi GPS.");
        }
      );
    } else {
      setIsLocating(false);
      alert("GPS tidak didukung oleh browser Anda.");
    }
  };

  async function handleGeojsonSubmit(formData: FormData) {
    setIsPending(true);
    setResult(null);
    try {
      const res = await uploadGeojson(formData);
      setResult(res);
    } catch (error: any) {
      setResult({ success: false, message: "Terjadi kesalahan sistem." });
    } finally {
      setIsPending(false);
    }
  }

  async function handleGpsSubmit(formData: FormData) {
    setIsPending(true);
    setResult(null);
    try {
      const res = await saveGpsTower(formData);
      setResult(res);
      if (res.success) {
        setLat("");
        setLng("");
        setOperator("");
        setKota("");
      }
    } catch (error: any) {
      setResult({ success: false, message: "Terjadi kesalahan sistem." });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen Data</h1>
        <p className="text-slate-500 text-sm mt-1">Tambahkan data infrastruktur menara baru.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
        <button 
          onClick={() => { setActiveTab('geojson'); setResult(null); }}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'geojson' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2">
            <UploadCloud size={16} /> Impor GeoJSON
          </div>
        </button>
        <button 
          onClick={() => { setActiveTab('gps'); setResult(null); }}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'gps' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2">
            <MapPin size={16} /> Tambah via GPS
          </div>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {activeTab === 'geojson' && (
          <>
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <UploadCloud className="text-indigo-500" />
                Impor GeoJSON
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Unggah file <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">.geojson</code> untuk menambahkan ratusan titik menara sekaligus.
              </p>
            </div>

            <form action={handleGeojsonSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label htmlFor="kota" className="block text-sm font-semibold text-slate-700">Nama Wilayah / Kota <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              name="kota" 
              id="kota" 
              required
              placeholder="Contoh: Jawa Barat"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="file" className="block text-sm font-semibold text-slate-700">File GeoJSON <span className="text-red-500">*</span></label>
            <input 
              type="file" 
              name="file" 
              id="file" 
              required
              accept=".geojson,application/geo+json"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          {result && (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${result.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {result.success ? <CheckCircle2 className="shrink-0 mt-0.5" size={20} /> : <AlertCircle className="shrink-0 mt-0.5" size={20} />}
              <div className="text-sm font-medium leading-relaxed">
                {result.message}
              </div>
            </div>
          )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button 
                type="submit" 
                disabled={isPending}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center gap-2"
              >
                {isPending ? (
                  <><Loader2 className="animate-spin" size={18} /> Memproses...</>
                ) : (
                  <><UploadCloud size={18} /> Mulai Impor</>
                )}
              </button>
            </div>
          </form>
          </>
        )}

        {activeTab === 'gps' && (
          <>
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="text-indigo-500" />
                Tambah Menara via GPS
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Catat titik koordinat menara langsung di lokasi Anda menggunakan sensor GPS perangkat.
              </p>
            </div>

            <form action={handleGpsSubmit} className="p-6 space-y-6">
              {/* GPS Coordinates Group */}
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-indigo-900">Titik Koordinat Lokasi</h3>
                  <button 
                    type="button" 
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLocating ? (
                      <><Loader2 size={14} className="animate-spin" /> Melacak...</>
                    ) : (
                      <><MapPin size={14} /> Ambil Lokasi Saat Ini</>
                    )}
                  </button>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-600">Latitude</label>
                    <input type="text" name="lat" required value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-6.123456" className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-mono" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-600">Longitude</label>
                    <input type="text" name="lng" required value={lng} onChange={(e) => setLng(e.target.value)} placeholder="106.123456" className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-mono" />
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
                    <select name="jenis" required className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm bg-white">
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
                  {isPending ? <><Loader2 className="animate-spin" size={18} /> Menyimpan...</> : <><CheckCircle2 size={18} /> Simpan Data</>}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
