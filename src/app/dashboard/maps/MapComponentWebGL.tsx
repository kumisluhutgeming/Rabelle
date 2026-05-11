"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Map, { Marker, Popup, NavigationControl, FullscreenControl, useMap, Layer, Source } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useIdle } from "../IdleProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, Signal, Tv, Radio as RadioIcon, Navigation, Loader2, Globe, Map as MapIcon, Moon, Layers, Palette, MapPin, X } from "lucide-react";
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
  const [selectedPoint, setSelectedPoint] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showCoverage, setShowCoverage] = useState(false);

  const zoomPercent = Math.max(0, Math.min(100, Math.round(((viewState.zoom - 4.2) / (18.4 - 4.2)) * 100)));
  const renderMode = viewState.zoom < 8.4 ? 'province' : (viewState.zoom < 11.1 ? 'kota' : 'point');

  const fetchMarkers = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    // In a real viewport-based system, we'd add bbox params here
    try {
      const res = await fetch(`/api/markers?${params.toString()}`);
      const data = await res.json();
      const newMarkers = data.markers || [];
      setMarkers(newMarkers);
      setStats(data.stats || { province: {}, kota: {} });

      // Auto fly-to based on true centroid of fetched data
      const kota = params.get('kota');
      const provinsi = params.get('provinsi');
      
      if ((kota || provinsi) && newMarkers.length > 0) {
        const sumLat = newMarkers.reduce((sum: number, m: any) => sum + Number(m.lat), 0);
        const sumLng = newMarkers.reduce((sum: number, m: any) => sum + Number(m.lng), 0);
        const avgLat = sumLat / newMarkers.length;
        const avgLng = sumLng / newMarkers.length;

        setViewState(prev => ({
          ...prev,
          longitude: avgLng,
          latitude: avgLat,
          zoom: kota ? 12 : 8.5,
          transitionDuration: 1500
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchMarkers();
  }, [fetchMarkers]);

  // Handle Signal Check (Geolocation)
  useEffect(() => {
    const handleCheckSignal = () => {
      if (!('geolocation' in navigator)) {
        alert("Geolokasi tidak didukung oleh browser Anda.");
        return;
      }
      
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLoading(false);
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          // Fly to location
          setViewState(prev => ({
            ...prev,
            longitude,
            latitude,
            zoom: 14,
            transitionDuration: 2000 // Smooth fly
          }));
        },
        (error) => {
          setIsLoading(false);
          alert("Akses lokasi ditolak atau gagal. Pastikan GPS aktif.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    window.addEventListener('checkSignal', handleCheckSignal);
    return () => window.removeEventListener('checkSignal', handleCheckSignal);
  }, []);

  const clusterData = useMemo(() => {
    if (renderMode === 'province') {
      return Object.entries(stats.province).map(([name, count]) => {
        let coords = PROVINCE_CENTERS[name];
        if (!coords) {
          const provLocs = locations.filter(l => l.provinsi === name && l.latitude && l.longitude);
          if (provLocs.length > 0) {
            const avgLat = provLocs.reduce((sum, l) => sum + Number(l.latitude), 0) / provLocs.length;
            const avgLng = provLocs.reduce((sum, l) => sum + Number(l.longitude), 0) / provLocs.length;
            coords = [avgLng, avgLat];
          }
        }
        if (!coords) return null;
        return { name, lng: coords[0], lat: coords[1], count };
      }).filter(Boolean);
    }
    if (renderMode === 'kota') {
      return Object.entries(stats.kota).map(([name, count]) => {
        let coords: [number, number] | undefined = undefined;
        const loc = locations.find(l => l.kota === name);
        if (loc && loc.latitude && loc.longitude) {
           coords = [Number(loc.longitude), Number(loc.latitude)];
        } else if (CITY_CENTERS[name]) {
           coords = CITY_CENTERS[name];
        }
        
        if (!coords) return null;
        return { name, lng: coords[0], lat: coords[1], count };
      }).filter(Boolean);
    }
    return [];
  }, [renderMode, stats, locations]);

  return (
    <div className="h-full w-full relative bg-slate-100 overflow-hidden">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={MAP_THEMES[activeTheme].url as any}
        style={{ width: "100%", height: "100%" }}
        mapLibre={maplibregl}
        maxZoom={18.4}
        minZoom={4.2}
        maxBounds={[[94.0, -11.0], [141.0, 6.0]]}
        interactiveLayerIds={['point-layer']}
        onClick={(e) => {
          if (e.features && e.features.length > 0) {
            setSelectedPoint(e.features[0].properties);
          } else {
            setSelectedPoint(null);
          }
        }}
        onMouseEnter={(e) => {
          if (e.features && e.features.length > 0) e.target.getCanvas().style.cursor = 'pointer';
        }}
        onMouseLeave={(e) => {
          e.target.getCanvas().style.cursor = '';
        }}
      >
        <NavigationControl position="bottom-right" />
        
        {/* Render Clusters as HTML Markers (for high fidelity) */}
        {renderMode !== 'point' && clusterData.map((cluster: any) => (
          <Marker key={cluster.name} longitude={cluster.lng} latitude={cluster.lat} anchor="center">
            <div 
              className="flex flex-col items-center"
              onClick={(e) => {
                e.stopPropagation();
                setViewState(prev => ({
                  ...prev,
                  longitude: cluster.lng,
                  latitude: cluster.lat,
                  zoom: renderMode === 'province' ? 8.5 : 12.0,
                  transitionDuration: 1500
                }));
              }}
            >
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
            {/* Radius Gradasi (Coverage) - Merah, Kuning, Hijau */}
            {/* Merah (Luar / Sinyal Lemah) */}
            {showCoverage && (
              <Layer
                id="radius-layer-outer"
                type="circle"
                paint={{
                  "circle-radius": [
                    "let", "base_r", ["match", ["get", "jenis"], "Televisi", 50000, "Televisi Siaran", 50000, "Radio Siaran", 30000, "Radio", 30000, 5000],
                    [
                      "interpolate", ["exponential", 2], ["zoom"],
                      10, ["*", 1.0, ["/", ["var", "base_r"], 152]],
                      15, ["*", 1.0, ["/", ["var", "base_r"], 4.77]]
                    ]
                  ],
                  "circle-color": "#ef4444",
                  "circle-opacity": 0.15,
                  "circle-blur": 0.8
                }}
              />
            )}
            {/* Kuning (Tengah / Sinyal Sedang) */}
            {showCoverage && (
              <Layer
                id="radius-layer-mid"
                type="circle"
                paint={{
                  "circle-radius": [
                    "let", "base_r", ["match", ["get", "jenis"], "Televisi", 50000, "Televisi Siaran", 50000, "Radio Siaran", 30000, "Radio", 30000, 5000],
                    [
                      "interpolate", ["exponential", 2], ["zoom"],
                      10, ["*", 0.6, ["/", ["var", "base_r"], 152]],
                      15, ["*", 0.6, ["/", ["var", "base_r"], 4.77]]
                    ]
                  ],
                  "circle-color": "#eab308",
                  "circle-opacity": 0.25,
                  "circle-blur": 0.8
                }}
              />
            )}
            {/* Hijau (Dalam / Sinyal Kuat) */}
            {showCoverage && (
              <Layer
                id="radius-layer-inner"
                type="circle"
                paint={{
                  "circle-radius": [
                    "let", "base_r", ["match", ["get", "jenis"], "Televisi", 50000, "Televisi Siaran", 50000, "Radio Siaran", 30000, "Radio", 30000, 5000],
                    [
                      "interpolate", ["exponential", 2], ["zoom"],
                      10, ["*", 0.25, ["/", ["var", "base_r"], 152]],
                      15, ["*", 0.25, ["/", ["var", "base_r"], 4.77]]
                    ]
                  ],
                  "circle-color": "#10b981",
                  "circle-opacity": 0.4,
                  "circle-blur": 0.5
                }}
              />
            )}
            {/* Titik Pusat (Tower) */}
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

        {/* User Location Radar Ping */}
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-24 h-24 bg-emerald-500/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute w-12 h-12 bg-emerald-500/30 rounded-full animate-pulse" />
              <div className="w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)] z-10" />
            </div>
          </Marker>
        )}

        {/* Selected Point Popup (Idea 4 reverted) */}
        {selectedPoint && (
          <Popup
            longitude={selectedPoint.lng}
            latitude={selectedPoint.lat}
            anchor="bottom"
            onClose={() => setSelectedPoint(null)}
            closeOnClick={false}
            className="z-50"
            maxWidth="320px"
          >
            <div className="p-1 space-y-3 min-w-[240px]">
              {/* Header */}
              <div>
                <h3 className="font-black text-slate-800 text-sm leading-tight">{selectedPoint.nama}</h3>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-widest rounded">{selectedPoint.jenis || 'Infrastruktur'}</span>
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded">Aktif</span>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-start gap-2">
                  <MapPin size={12} className="text-rose-500 mt-0.5 flex-shrink-0" />
                  <div>
                    {selectedPoint.alamat && selectedPoint.alamat.trim() !== "" && (
                      <div className="text-[11px] font-bold text-slate-800 leading-snug mb-0.5">{selectedPoint.alamat}</div>
                    )}
                    <div className="text-[10px] font-medium text-slate-500">{selectedPoint.kota}, {selectedPoint.provinsi}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Navigation size={12} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-[10px] font-mono font-medium text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded">{selectedPoint.lat.toFixed(5)}, {selectedPoint.lng.toFixed(5)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100">
                <a href={`/dashboard/data-tabel?search=${encodeURIComponent(selectedPoint.nama)}`} className="w-full py-1.5 bg-slate-900 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors flex justify-center items-center">
                  Lihat Detail Tabel
                </a>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Viewport Status Indicator (Left) */}
      <div className={`absolute bottom-6 left-6 z-[1000] flex flex-col gap-3 transition-opacity duration-300 ${!isUiVisible ? "opacity-0" : "opacity-100"}`}>
        <div className="liquid-glass px-4 py-3 shadow-xl flex items-center gap-3">
          {isLoading ? <Loader2 size={16} className="animate-spin text-indigo-500" /> : <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
          <div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Akselerasi GPU</div>
            <div className="text-[11px] font-black text-slate-700">{renderMode === 'point' ? `Menampilkan ${markers.length} Titik` : `Mode Kluster ${renderMode === 'province' ? 'Provinsi' : 'Kota'}`}</div>
          </div>
        </div>
      </div>

      {/* Control Cluster (Right) */}
      <div className={`absolute bottom-6 right-16 z-[1000] flex items-end gap-3 transition-opacity duration-300 ${!isUiVisible ? "opacity-0" : "opacity-100"}`}>
        
        {/* Coverage Toggle Button */}
        <button 
          onClick={() => setShowCoverage(!showCoverage)}
          className={`liquid-glass relative p-3 shadow-xl hover:scale-105 active:scale-95 transition-all border-none flex items-center justify-center ${showCoverage ? 'text-white bg-indigo-500' : 'text-indigo-600'}`}
          title={showCoverage ? "Sembunyikan Jangkauan Sinyal" : "Tampilkan Jangkauan Sinyal"}
        >
          <Wifi size={20} />
          {showCoverage && <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
        </button>

        {/* Theme Picker */}
        <div className="relative">
          <AnimatePresence>
            {isThemeMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full mb-3 right-0 origin-bottom-right liquid-glass p-2 shadow-2xl flex flex-col gap-1 min-w-[140px]"
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
            title="Ganti Tema Peta"
          >
            <Palette size={20} />
          </button>
        </div>

        {/* Zoom Bubble */}
        <div className="liquid-glass px-3 py-2 shadow-xl border-none min-w-[60px] text-center mb-[2px]">
          <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Zoom</div>
          <div className="text-[11px] font-black text-indigo-600 font-mono leading-none">{zoomPercent}%</div>
        </div>
      </div>
    </div>
  );
}
