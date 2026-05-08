"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Map, { Marker, NavigationControl, FullscreenControl, useMap, Layer, Source } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useIdle } from "../IdleProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, Signal, Tv, Radio as RadioIcon, Navigation, Loader2, Globe, Map as MapIcon, Moon, Layers, Palette } from "lucide-react";
import { useSearchParams } from "next/navigation";

const MAP_THEMES = {
  colorful: {
    name: "Colorful",
    url: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
    icon: "Globe"
  },
  voyager: {
    name: "Voyager",
    url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    icon: "Map"
  },
  dark: {
    name: "Dark",
    url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    icon: "Moon"
  },
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

const PROVINCE_CENTERS: Record<string, [number, number]> = {
  "Jawa Barat": [107.6191, -6.9175],
  "Jawa Tengah": [110.4381, -7.0051],
  "Jawa Timur": [112.7521, -7.2575],
  "DKI Jakarta": [106.8456, -6.2088],
  "Banten": [106.1503, -6.1200],
  "DI Yogyakarta": [110.3695, -7.7956],
  "Bali": [115.0920, -8.3405]
};

const CITY_CENTERS: Record<string, [number, number]> = {
  "Kota Bandung": [107.6191, -6.9175],
  "Kota Semarang": [110.4167, -6.9667],
  "Kota Surabaya": [112.7521, -7.2575],
  "Kota Yogyakarta": [110.3695, -7.7956],
  "Kota Denpasar": [115.2126, -8.6705],
  "Jakarta Pusat": [106.8341, -6.1865],
  "Kota Cilegon": [106.0112, -6.0025],
  "Kota Serang": [106.1503, -6.1200],
  "Kota Tangerang": [106.6319, -6.1783],
  "Kota Bekasi": [106.9756, -6.2383],
  "Kota Depok": [106.7942, -6.4025],
  "Kota Bogor": [106.8166, -6.5950]
};

export default function MapComponentWebGL({ locations = [] }: { locations: any[] }) {
  const { isUiVisible } = useIdle();
  const searchParams = useSearchParams();
  const [activeTheme, setActiveTheme] = useState<keyof typeof MAP_THEMES>("colorful");
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: 107.6098,
    latitude: -6.9147,
    zoom: 8,
    pitch: 0,
    bearing: 0
  });

  const [markers, setMarkers] = useState<any[]>([]);
  const [stats, setStats] = useState<{province: Record<string, number>, kota: Record<string, number>}>({ province: {}, kota: {} });
  const [isLoading, setIsLoading] = useState(false);

  const zoomPercent = Math.max(0, Math.min(100, Math.round(((viewState.zoom - 5) / (18.4 - 5)) * 100)));
  const renderMode = zoomPercent < 30 ? 'province' : (zoomPercent < 60 ? 'kota' : 'point');

  const fetchMarkers = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    // In a real viewport-based system, we'd add bbox params here
    try {
      const res = await fetch(`/api/markers?${params.toString()}`);
      const data = await res.json();
      setMarkers(data.markers || []);
      setStats(data.stats || { province: {}, kota: {} });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchMarkers();
  }, [fetchMarkers]);

  const clusterData = useMemo(() => {
    if (renderMode === 'province') {
      return Object.entries(PROVINCE_CENTERS).map(([name, coords]) => ({
        name, lng: coords[0], lat: coords[1], count: stats.province[name] || 0
      })).filter(c => c.count > 0);
    }
    if (renderMode === 'kota') {
      return Object.entries(stats.kota).map(([name, count]) => {
        const coords = CITY_CENTERS[name];
        if (!coords) return null;
        return { name, lng: coords[0], lat: coords[1], count };
      }).filter(Boolean);
    }
    return [];
  }, [renderMode, stats]);

  return (
    <div className="h-full w-full relative bg-slate-100 overflow-hidden">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={MAP_THEMES[activeTheme].url as any}
        style={{ width: "100%", height: "100%" }}
        mapLibre={maplibregl}
        maxZoom={18.4}
      >
        <NavigationControl position="bottom-right" />
        
        {/* Render Clusters as HTML Markers (for high fidelity) */}
        {renderMode !== 'point' && clusterData.map((cluster: any) => (
          <Marker key={cluster.name} longitude={cluster.lng} latitude={cluster.lat} anchor="center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/90 border border-white/40 shadow-2xl backdrop-blur-md flex flex-col items-center justify-center text-white scale-90 hover:scale-100 transition-transform cursor-pointer">
                <span className="text-[11px] font-black">{cluster.count > 999 ? (cluster.count/1000).toFixed(1) + 'k' : cluster.count}</span>
                <span className="text-[7px] font-bold opacity-70 uppercase tracking-tighter">{renderMode === 'province' ? 'PROV' : 'KOTA'}</span>
              </div>
              <div className="mt-1 px-2 py-0.5 bg-white/90 rounded-full shadow-sm">
                <span className="text-[9px] font-black text-slate-800">{cluster.name}</span>
              </div>
            </div>
          </Marker>
        ))}

        {/* Render Points (Using WebGL Layer for thousands of points) */}
        {renderMode === 'point' && (
          <Source id="points" type="geojson" data={{
            type: "FeatureCollection",
            features: markers.map(m => ({
              type: "Feature",
              geometry: { type: "Point", coordinates: [m.lng, m.lat] },
              properties: { ...m }
            }))
          }}>
            <Layer
              id="point-layer"
              type="circle"
              paint={{
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3, 15, 8],
                "circle-color": "#4f46e5",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffffff"
              }}
            />
          </Source>
        )}
      </Map>

      {/* Viewport Status Indicator & Theme Switcher */}
      <div className={`absolute bottom-6 left-6 z-[1000] flex flex-col gap-3 transition-opacity duration-300 ${!isUiVisible ? "opacity-0" : "opacity-100"}`}>
        {/* Theme Picker */}
        <div className="relative">
          <AnimatePresence>
            {isThemeMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full mb-3 left-0 liquid-glass p-2 shadow-2xl flex flex-col gap-1 min-w-[140px]"
              >
                {Object.entries(MAP_THEMES).map(([key, theme]) => (
                  <button 
                    key={key} 
                    onClick={() => { setActiveTheme(key as any); setIsThemeMenuOpen(false); }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-black transition-all ${activeTheme === key ? "bg-indigo-600 text-white shadow-md" : "hover:bg-white/40 text-slate-700"}`}
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
            className="liquid-glass p-3 shadow-xl hover:scale-105 active:scale-95 transition-all text-indigo-600 border-none"
          >
            <Palette size={20} />
          </button>
        </div>

        <div className="liquid-glass px-4 py-3 shadow-xl flex items-center gap-3">
          {isLoading ? <Loader2 size={16} className="animate-spin text-indigo-500" /> : <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
          <div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Akselerasi GPU</div>
            <div className="text-[11px] font-black text-slate-700">{renderMode === 'point' ? `Menampilkan ${markers.length} Titik` : `Mode Kluster ${renderMode === 'province' ? 'Provinsi' : 'Kota'}`}</div>
          </div>
        </div>
      </div>

      {/* Persistent Zoom Bubble - Bottom Right */}
      <div className={`absolute bottom-6 right-20 z-[1000] transition-opacity duration-300 ${!isUiVisible ? "opacity-0" : "opacity-100"}`}>
        <div className="liquid-glass px-3 py-2 shadow-xl border-none min-w-[60px] text-center">
          <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Scale</div>
          <div className="text-[11px] font-black text-indigo-600 font-mono leading-none">{viewState.zoom.toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
}
