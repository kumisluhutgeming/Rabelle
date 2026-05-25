import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X } from "lucide-react";

interface CheckSignalPanelProps {
  userLocation: { lat: number, lng: number } | null;
  nearestTower: any | null;
  signalUnit: string;
  onRefresh: () => void;
  onClose: () => void;
}

export default function CheckSignalPanel({
  userLocation,
  nearestTower,
  signalUnit,
  onRefresh,
  onClose
}: CheckSignalPanelProps) {
  const getSignalInfo = (dbm: number) => {
    if (signalUnit === "dbm") return `${dbm} dBm`;
    const percent = Math.max(0, Math.min(100, Math.round(((dbm + 110) / 80) * 100)));
    return `${percent}%`;
  };

  return (
    <AnimatePresence>
      {userLocation && nearestTower && (
        <motion.div 
          key="hud-panel" 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -20 }} 
          className="absolute top-6 left-1/2 -translate-x-1/2 z-[2000]"
        >
          <div className="bg-background/80 backdrop-blur-md border border-border shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-6 min-w-[400px]">
            <div className="flex items-center gap-4 border-r border-border/50 pr-6">
              {(() => {
                const dbm = nearestTower.dbm || -110;
                
                let quality = 1;
                let colorClass = "text-muted-foreground";
                let bgClass = "bg-muted";
                let statusText = "Blank Spot";

                if (dbm >= -75) {
                  quality = 4; colorClass = "text-emerald-500"; bgClass = "bg-emerald-500"; statusText = "Sangat Kuat";
                } else if (dbm >= -90) {
                  quality = 3; colorClass = "text-amber-500"; bgClass = "bg-amber-500"; statusText = "Cukup Baik";
                } else if (dbm >= -110) {
                  quality = 2; colorClass = "text-rose-500"; bgClass = "bg-rose-500"; statusText = "Lemah";
                } else {
                  quality = 1; colorClass = "text-slate-500"; bgClass = "bg-slate-500"; statusText = "Di Luar Jangkauan";
                }

                return (
                  <>
                    <div className="flex flex-col items-center">
                      <div className="flex items-end gap-0.5 h-4 mb-1">
                        {[1, 2, 3, 4].map(b => (
                          <div key={b} className={`w-1 rounded-full ${b <= quality ? bgClass : 'bg-muted/30'}`} style={{ height: `${b * 25}%` }} />
                        ))}
                      </div>
                      <span className={`text-[12px] font-black tracking-tighter ${colorClass}`}>{getSignalInfo(dbm)}</span>
                    </div>
                    <div className="h-8 w-px bg-border/30 mx-1" />
                    <div>
                      <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Status</div>
                      <div className={`text-[11px] font-black uppercase ${colorClass}`}>{statusText}</div>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="flex-1 flex items-center gap-6">
              <div className="min-w-0">
                <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Tower Terdekat</div>
                <div className="text-[11px] font-bold text-foreground truncate max-w-[120px]">{nearestTower.nama}</div>
              </div>
              <div>
                <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Jarak</div>
                <div className="text-[11px] font-bold text-foreground">{(nearestTower.distance / 1000).toFixed(2)} km</div>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-4 border-l border-border/50 text-muted-foreground">
              <button onClick={onRefresh} className="p-2 hover:text-indigo-600"><Loader2 size={14} /></button>
              <button onClick={onClose} className="p-2 hover:text-red-500"><X size={14} /></button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
