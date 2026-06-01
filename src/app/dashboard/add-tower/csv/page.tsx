"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Play } from "lucide-react";
import { importTowers } from "@/app/actions/import";

export default function CsvImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const f = e.target.files[0];
      setFile(f);
      setMessage(null);
      
      Papa.parse(f, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setData(results.data);
        },
        error: (error) => {
          setMessage({ type: 'error', text: `Gagal membaca CSV: ${error.message}` });
        }
      });
    }
  };

  const handleImport = async () => {
    if (data.length === 0) return;
    
    setLoading(true);
    setMessage(null);
    try {
      const result = await importTowers(data);
      if (result.success) {
        setMessage({ type: 'success', text: `Berhasil mengimpor ${result.count} data menara!` });
        setData([]);
        setFile(null);
      } else {
        setMessage({ type: 'error', text: result.message || result.error || 'Terjadi kesalahan saat mengimpor.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">Impor Data CSV</h1>
        <p className="text-muted-foreground mt-2">Unggah file CSV yang berisi data lokasi pemancar untuk memperbarui database secara massal. Pastikan format kolom sesuai dengan template standar.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-border rounded-xl bg-background/50 hover:bg-secondary/20 transition-colors">
          <FileSpreadsheet size={48} className="text-primary mb-4 opacity-80" />
          <h3 className="text-lg font-bold mb-2">Pilih File CSV</h3>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
            Pilih file .csv dari komputer Anda. Kolom ID akan diabaikan (ID baru akan otomatis di-generate).
          </p>
          <label className="cursor-pointer bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium shadow-md hover:bg-primary/90 transition-all flex items-center gap-2">
            <Upload size={18} />
            <span>Jelajahi File</span>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {file && (
          <div className="mt-6 p-4 bg-secondary/50 rounded-xl border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">{data.length} baris data terdeteksi</p>
              </div>
            </div>
            <button 
              onClick={handleImport}
              disabled={loading || data.length === 0}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play size={16} className="fill-current" />
              )}
              {loading ? 'Memproses...' : 'Mulai Impor'}
            </button>
          </div>
        )}

        {message && (
          <div className={`mt-4 p-4 rounded-xl flex items-start gap-3 border ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} className="mt-0.5" /> : <AlertTriangle size={20} className="mt-0.5" />}
            <div>
              <p className="font-bold text-sm">{message.type === 'success' ? 'Sukses' : 'Gagal'}</p>
              <p className="text-sm opacity-90">{message.text}</p>
            </div>
          </div>
        )}
      </div>

      {data.length > 0 && (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h3 className="font-bold">Pratinjau Data (5 Baris Pertama)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-3">Operator</th>
                  <th className="px-6 py-3">Jenis</th>
                  <th className="px-6 py-3">Kota</th>
                  <th className="px-6 py-3">Provinsi</th>
                  <th className="px-6 py-3">Latitude</th>
                  <th className="px-6 py-3">Longitude</th>
                  <th className="px-6 py-3">Frekuensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.slice(0, 5).map((row, i) => (
                  <tr key={i} className="hover:bg-muted/50">
                    <td className="px-6 py-3 font-medium">{row.Operator || row.nama_penyelenggara || '-'}</td>
                    <td className="px-6 py-3">{row['Jenis Komunikasi'] || row.jenis_komunikasi || '-'}</td>
                    <td className="px-6 py-3">{row.Kota || row.kota || '-'}</td>
                    <td className="px-6 py-3">{row.Provinsi || row.provinsi || '-'}</td>
                    <td className="px-6 py-3 font-mono text-xs">{row.Latitude || row.latitude || '-'}</td>
                    <td className="px-6 py-3 font-mono text-xs">{row.Longitude || row.longitude || '-'}</td>
                    <td className="px-6 py-3 font-mono text-xs">{row.Frekuensi || row.frekuensi || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
