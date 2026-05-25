import { Loader2 } from "lucide-react";

interface MapStatsOverlayProps {
  isLoading: boolean;
  renderMode: string;
  markersCount: number;
}

export default function MapStatsOverlay({
  isLoading,
  renderMode,
  markersCount
}: MapStatsOverlayProps) {
  return (
    <div className="absolute bottom-6 left-6 z-[1000]">
      <div className="bg-background/95 backdrop-blur-md border border-border px-4 py-3 shadow-2xl rounded-2xl flex items-center gap-3">
        {isLoading ? (
          <Loader2 size={16} className="animate-spin text-indigo-500" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        )}
        <div>
          <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Akselerasi GPU</div>
          <div className="text-[11px] font-black text-foreground">
            {renderMode === 'point' 
              ? `Menampilkan ${markersCount} Titik` 
              : `Mode Kluster ${renderMode === 'province' ? 'Provinsi' : 'Kota'}`}
          </div>
        </div>
      </div>
    </div>
  );
}
