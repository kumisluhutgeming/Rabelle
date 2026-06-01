import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Signal, Wifi, Palette, Globe, Map as MapIcon, Moon, Layers } from "lucide-react";

export const MAP_THEMES = {
  colorful: { name: "Colorful", url: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json", icon: "Globe" },
  voyager: { name: "Voyager", url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json", icon: "Map" },
  dark: { name: "Dark", url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json", icon: "Moon" },
  satellite: {
    name: "Satelit",
    url: {
      version: 8,
      sources: {
        "satellite-tiles": {
          type: "raster",
          tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
          tileSize: 256,
          attribution: "Esri"
        }
      },
      layers: [
        { id: "satellite", type: "raster", source: "satellite-tiles" }
      ]
    },
    icon: "Layers"
  }
};

interface MapControlsProps {
  showCoverage: boolean;
  setShowCoverage: (val: boolean) => void;
  mapTheme: string;
  setMapTheme: (theme: any) => void;
  zoomPercent: number;
  onCheckSignal: () => void;
  activeJenisFilter?: string | null;
}

export default function MapControls({
  showCoverage,
  setShowCoverage,
  mapTheme,
  setMapTheme,
  zoomPercent,
  onCheckSignal,
  activeJenisFilter
}: MapControlsProps) {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  return (
    <div className="absolute bottom-6 right-16 z-[1000] flex items-end gap-3">
      <button 
        onClick={onCheckSignal} 
        className="w-12 h-12 rounded-2xl bg-background/95 border border-border shadow-2xl hover:scale-105 transition-all text-indigo-600 flex items-center justify-center"
      >
        <Signal size={20} />
      </button>
      
      <button 
        onClick={() => setShowCoverage(!showCoverage)} 
        className={`w-12 h-12 rounded-2xl shadow-2xl hover:scale-105 transition-all flex items-center justify-center border ${showCoverage ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-background/95 border-border text-indigo-600'}`}
      >
        <Wifi size={20} />
      </button>
      
      <div className="relative">
        <AnimatePresence>
          {isThemeMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 10 }} 
              className="absolute bottom-full mb-3 right-0 bg-background/95 border border-border p-2 shadow-2xl flex flex-col gap-1 min-w-[140px] rounded-2xl"
            >
              {Object.entries(MAP_THEMES).map(([key, theme]) => (
                <button 
                  key={key} 
                  onClick={() => { setMapTheme(key); setIsThemeMenuOpen(false); }} 
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-black ${mapTheme === key ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
                >
                  {theme.icon === "Globe" && <Globe size={14} />}
                  {theme.icon === "Map" && <MapIcon size={14} />}
                  {theme.icon === "Moon" && <Moon size={14} />}
                  {theme.icon === "Layers" && <Layers size={14} />}
                  {theme.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <button 
          onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)} 
          className="w-12 h-12 rounded-2xl bg-background/95 border border-border shadow-2xl hover:scale-105 transition-all text-indigo-600 flex items-center justify-center"
        >
          <Palette size={20} />
        </button>
      </div>

      <div className="bg-background/95 border border-border px-3 py-2 shadow-2xl rounded-2xl min-w-[60px] text-center">
        <div className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter mb-0.5">Zoom</div>
        <div className="text-[11px] font-black text-indigo-600 font-mono">{zoomPercent}%</div>
      </div>
      

    </div>
  );
}
