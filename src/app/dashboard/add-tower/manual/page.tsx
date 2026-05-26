"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { MapPin, Target, Send, CheckCircle, AlertTriangle } from "lucide-react";
import { importTowers } from "@/app/actions/import";

type FormData = {
  Operator: string;
  "Jenis Komunikasi": string;
  Kota: string;
  Provinsi: string;
  Latitude: string;
  Longitude: string;
  "Tinggi Menara (m)": string;
  Frekuensi: string;
  Azimuths: string;
};

export default function ManualInputPage() {
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await importTowers([data]);
      if (result.success) {
        setMessage({ type: 'success', text: 'Berhasil menambahkan data menara baru!' });
        reset();
      } else {
        setMessage({ type: 'error', text: result.error || 'Terjadi kesalahan saat menyimpan data.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (!('geolocation' in navigator)) {
      alert("Geolokasi tidak didukung oleh browser Anda.");
      return;
    }
    
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("Latitude", position.coords.latitude.toString(), { shouldValidate: true });
        setValue("Longitude", position.coords.longitude.toString(), { shouldValidate: true });
        setGeoLoading(false);
      },
      (error) => {
        setGeoLoading(false);
        alert("Gagal mendapatkan lokasi. Pastikan izin GPS diberikan.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">Input Data Manual</h1>
        <p className="text-muted-foreground mt-2">Tambahkan data infrastruktur menara baru satu per satu ke dalam database. Gunakan fitur GPS untuk akurasi lokasi.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} className="mt-0.5" /> : <AlertTriangle size={20} className="mt-0.5" />}
          <div>
            <p className="font-bold text-sm">{message.type === 'success' ? 'Sukses' : 'Gagal'}</p>
            <p className="text-sm opacity-90">{message.text}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-2xl shadow-sm p-8 space-y-8">
        
        {/* Seksi Lokasi */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <MapPin size={20} className="text-primary" />
              Koordinat & Wilayah
            </h3>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={geoLoading}
              className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Target size={14} />
              {geoLoading ? 'Mencari...' : 'Gunakan Lokasi Saat Ini'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Latitude *</label>
              <input 
                {...register("Latitude", { required: true })} 
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-sm"
                placeholder="-6.200000"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Longitude *</label>
              <input 
                {...register("Longitude", { required: true })} 
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-sm"
                placeholder="106.816666"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Provinsi *</label>
              <input 
                {...register("Provinsi", { required: true })} 
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Mis: DKI Jakarta"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Kota/Kabupaten *</label>
              <input 
                {...register("Kota", { required: true })} 
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Mis: Jakarta Pusat"
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-border w-full" />

        {/* Seksi Teknis */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Send size={20} className="text-primary" />
            Spesifikasi Pemancar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Operator *</label>
              <input 
                {...register("Operator", { required: true })} 
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Mis: Telkomsel / TVRI"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Jenis Komunikasi *</label>
              <select 
                {...register("Jenis Komunikasi", { required: true })} 
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="Seluler">Seluler</option>
                <option value="Televisi">Televisi</option>
                <option value="Radio Siaran">Radio Siaran</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Tinggi Menara (m)</label>
              <input 
                {...register("Tinggi Menara (m)")} 
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-sm"
                placeholder="Mis: 45"
                type="number"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Frekuensi (MHz)</label>
              <input 
                {...register("Frekuensi")} 
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-sm"
                placeholder="Mis: 1800"
                type="number"
              />
            </div>
            <div className="col-span-1 md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Azimuths (Sektor)</label>
              <input 
                {...register("Azimuths")} 
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-sm"
                placeholder="Mis: 0, 120, 240 (Pisahkan dengan koma)"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-xl font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <CheckCircle size={18} />
            )}
            {loading ? 'Menyimpan...' : 'Simpan Data'}
          </button>
        </div>
      </form>
    </div>
  );
}
