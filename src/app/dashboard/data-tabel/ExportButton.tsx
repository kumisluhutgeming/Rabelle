"use client";

import { useState } from "react";
import { exportCsvData } from "./actions";
import { Download, Loader2 } from "lucide-react";

interface ExportButtonProps {
  params: {
    jenis?: string;
    provinsi?: string;
    kota?: string;
  };
}

export default function ExportButton({ params }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const result = await exportCsvData(params);
      if (result.success && result.csv) {
        // Create Blob and click to trigger download
        const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `rabelle-dataset-${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(result.message || "Gagal mengunduh dataset.");
      }
    } catch (e: any) {
      alert("Terjadi kesalahan sistem saat mengekspor: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="bg-[#007AFF] hover:bg-[#0066CC] active:scale-95 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
    >
      {loading ? (
        <Loader2 className="animate-spin" size={20} />
      ) : (
        <Download size={20} />
      )}
      <span>{loading ? "Mengekspor..." : "Unduh Dataset"}</span>
    </button>
  );
}
