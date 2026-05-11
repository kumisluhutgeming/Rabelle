"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Map, { Marker, Popup, NavigationControl, FullscreenControl, useMap, Layer, Source } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useIdle } from "../IdleProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, Signal, Tv, Radio as RadioIcon, Navigation, Loader2, Globe, Map as MapIcon, Moon, Layers, Palette, MapPin, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { usePreferences } from "../PreferencesProvider";

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
  const { mapTheme, setMapTheme, coordFormat, signalUnit } = usePreferences();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: 107.6098,
    latitude: -6.9147,
    zoom: 8,
    pitch: 0,
    bearing: 0
  });

  const formatCoordinate = (val: number, isLat: boolean) => {
    if (coordFormat === "decimal") return val.toFixed(5);
    
    const absolute = Math.abs(val);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
    
    const direction = isLat 
      ? (val >= 0 ? "N" : "S") 
      : (val >= 0 ? "E" : "W");
      
    return `${degrees}°${minutes}'${seconds}" ${direction}`;
  };

  const [markers, setMarkers] = useState<any[]>([]);
  const [stats, setStats] = useState<{province: Record<string, number>, kota: Record<string, number>}>({ province: {}, kota: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [nearestTower, setNearestTower] = useState<any | null>(null);
  const [showCoverage, setShowCoverage] = useState(false);

  const zoomPercent = Math.max(0, Math.min(100, Math.round(((viewState.zoom - 4.2) / (18.4 - 4.2)) * 100)));
  const renderMode = viewState.zoom < 8.4 ? 'province' : (viewState.zoom < 11.1 ? 'kota' : 'point');

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getSignalInfo = (dbm: number) => {
    if (signalUnit === "dbm") return `${dbm} dBm`;
    const percent = Math.max(0, Math.min(100, Math.round(((dbm + 110) / 80) * 100)));
    return `${percent}%`;
  };

  const fetchMarkers = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    try {
      const res = await fetch(`/api/markers?${params.toString()}`);
      const data = await res.json();
      const newMarkers = data.markers || [];
      setMarkers(newMarkers);
      setStats(data.stats || { province: {}, kota: {} });

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
          
          if (markers.length > 0) {
            let closest = null;
            let minDiv = Infinity;
            const telcoMarkers = markers.filter(m => m.jenis?.toLowerCase().includes('tele') || m.jenis?.toLowerCase().includes('seluler'));
            const targetMarkers = telcoMarkers.length > 0 ? telcoMarkers : markers;

            targetMarkers.forEach(m => {
              const d = calculateDistance(latitude, longitude, Number(m.lat), Number(m.lng));
              if (d < minDiv) {
                minDiv = d;
                closest = { ...m, distance: d };
              }
            });
            setNearestTower(closest);
          }

          setViewState(prev => ({
            ...prev,
            longitude,
            latitude,
            zoom: 15,
            transitionDuration: 2000
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
  }, [markers]);

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
        mapStyle={MAP_THEMES[mapTheme as keyof typeof MAP_THEMES].url as any}
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
      >
        <NavigationControl position="bottom-right" />
        
        {renderMode !== 'point' && clusterData.map((cluster: any) => (
          <Marker key={cluster.name} longitude={cluster.lng} latitude={cluster.lat} anchor="center">
            <div 
              className="flex flex-col items-center"
              onClick={(e) => {
                e.stopPropagation();
                setViewState(prev => ({ ...prev, longitude: cluster.lng, latitude: cluster.lat, zoom: renderMode === 'province' ? 8.5 : 12.0, transitionDuration: 1500 }));
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

        {renderMode === 'point' && (
          <Source id="points" type="geojson" data={{
            type: "FeatureCollection",
            features: markers.map(m => ({
              type: "Feature",
              geometry: { type: "Point", coordinates: [m.lng, m.lat] },
              properties: { ...m }
            }))
          }}>
            {showCoverage && (
              <Layer id="radius-outer" type="circle" paint={{ 
                "circle-radius": ["let", "base", ["match", ["get", "jenis"], "Televisi", 50000, "Radio Siaran", 30000, 5000], 
                  ["interpolate", ["exponential", 2], ["zoom"], 
                    0, ["/", ["var", "base"], 156543],
                    10, ["/", ["var", "base"], 152.87],
                    15, ["/", ["var", "base"], 4.77],
                    20, ["/", ["var", "base"], 0.149]
                  ]
                ], 
                "circle-color": "#ef4444", 
                "circle-opacity": 0.15, 
                "circle-blur": 0.8,
                "circle-pitch-alignment": "map",
                "circle-pitch-scale": "map"
              }} />
            )}
            {showCoverage && (
              <Layer id="radius-mid" type="circle" paint={{ 
                "circle-radius": ["let", "base", ["match", ["get", "jenis"], "Televisi", 50000, "Radio Siaran", 30000, 5000], 
                  ["interpolate", ["exponential", 2], ["zoom"], 
                    0, ["/", ["*", 0.6, ["var", "base"]], 156543],
                    10, ["/", ["*", 0.6, ["var", "base"]], 152.87],
                    15, ["/", ["*", 0.6, ["var", "base"]], 4.77],
                    20, ["/", ["*", 0.6, ["var", "base"]], 0.149]
                  ]
                ], 
                "circle-color": "#eab308", 
                "circle-opacity": 0.25, 
                "circle-blur": 0.8,
                "circle-pitch-alignment": "map",
                "circle-pitch-scale": "map"
              }} />
            )}
            {showCoverage && (
              <Layer id="radius-inner" type="circle" paint={{ 
                "circle-radius": ["let", "base", ["match", ["get", "jenis"], "Televisi", 50000, "Radio Siaran", 30000, 5000], 
                  ["interpolate", ["exponential", 2], ["zoom"], 
                    0, ["/", ["*", 0.25, ["var", "base"]], 156543],
                    10, ["/", ["*", 0.25, ["var", "base"]], 152.87],
                    15, ["/", ["*", 0.25, ["var", "base"]], 4.77],
                    20, ["/", ["*", 0.25, ["var", "base"]], 0.149]
                  ]
                ], 
                "circle-color": "#10b981", 
                "circle-opacity": 0.4, 
                "circle-blur": 0.5,
                "circle-pitch-alignment": "map",
                "circle-pitch-scale": "map"
              }} />
            )}
            <Layer id="point-layer" type="circle" paint={{ "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3, 15, 8], "circle-color": "#4f46e5", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" }} />
          </Source>
        )}

        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-24 h-24 bg-emerald-500/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute w-12 h-12 bg-emerald-500/30 rounded-full animate-pulse" />
              <div className="w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)] z-10" />
            </div>
          </Marker>
        )}

        {selectedPoint && (
          <Popup longitude={selectedPoint.lng} latitude={selectedPoint.lat} anchor="bottom" onClose={() => setSelectedPoint(null)} closeOnClick={false} className="z-50" maxWidth="320px">
            <div className="p-1 space-y-3 min-w-[240px]">
              <div>
                <h3 className="font-black text-slate-800 text-sm leading-tight">{selectedPoint.nama}</h3>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-widest rounded">{selectedPoint.jenis || 'Infrastruktur'}</span>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-start gap-2">
                  <MapPin size={12} className="text-rose-500 mt-0.5 flex-shrink-0" />
                  <div className="text-[10px] font-medium text-slate-500">{selectedPoint.kota}, {selectedPoint.provinsi}</div>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <Navigation size={12} className="text-emerald-500" />
                  {formatCoordinate(selectedPoint.lat, true)}, {formatCoordinate(selectedPoint.lng, false)}
                </div>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Floating HUD Outside Map component for safety */}
      <AnimatePresence>
        {userLocation && nearestTower && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-6 left-1/2 -translate-x-1/2 z-[2000]">
            <div className="bg-background/80 backdrop-blur-md border border-border shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-6 min-w-[400px]">
              <div className="flex items-center gap-4 border-r border-border/50 pr-6">
                {(() => {
                  const dbm = Math.max(-110, Math.min(-30, Math.round(-40 - 20 * Math.log10(Math.max(10, nearestTower.distance) / 10))));
                  const colorClass = dbm > -65 ? "text-emerald-500" : (dbm > -85 ? "text-amber-500" : "text-rose-500");
                  return (
                    <>
                      <div className="flex flex-col items-center">
                        <div className="flex items-end gap-0.5 h-4 mb-1">
                          {[1, 2, 3, 4].map(b => (
                            <div key={b} className={`w-1 rounded-full ${b <= (dbm > -65 ? 4 : (dbm > -85 ? 3 : 1)) ? (dbm > -65 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-muted/30'}`} style={{ height: `${b * 25}%` }} />
                          ))}
                        </div>
                        <span className={`text-[12px] font-black tracking-tighter ${colorClass}`}>{getSignalInfo(dbm)}</span>
                      </div>
                      <div className="h-8 w-px bg-border/30 mx-1" />
                      <div>
                        <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Status</div>
                        <div className={`text-[11px] font-black uppercase ${colorClass}`}>{dbm > -65 ? "Sangat Kuat" : "Cukup Baik"}</div>
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
                <button onClick={() => window.dispatchEvent(new CustomEvent('checkSignal'))} className="p-2 hover:text-indigo-600"><Loader2 size={14} /></button>
                <button onClick={() => setUserLocation(null)} className="p-2 hover:text-red-500"><X size={14} /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 left-6 z-[1000]">
        <div className="bg-background/95 backdrop-blur-md border border-border px-4 py-3 shadow-2xl rounded-2xl flex items-center gap-3">
          {isLoading ? <Loader2 size={16} className="animate-spin text-indigo-500" /> : <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
          <div>
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Akselerasi GPU</div>
            <div className="text-[11px] font-black text-foreground">{renderMode === 'point' ? `Menampilkan ${markers.length} Titik` : `Mode Kluster ${renderMode === 'province' ? 'Provinsi' : 'Kota'}`}</div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-16 z-[1000] flex items-end gap-3">
        <button onClick={() => window.dispatchEvent(new CustomEvent('checkSignal'))} className="w-12 h-12 rounded-2xl bg-background/95 border border-border shadow-2xl hover:scale-105 transition-all text-indigo-600 flex items-center justify-center"><Signal size={20} /></button>
        <button onClick={() => setShowCoverage(!showCoverage)} className={`w-12 h-12 rounded-2xl shadow-2xl hover:scale-105 transition-all flex items-center justify-center border ${showCoverage ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-background/95 border-border text-indigo-600'}`}><Wifi size={20} /></button>
        
        <div className="relative">
          <AnimatePresence>
            {isThemeMenuOpen && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full mb-3 right-0 bg-background/95 border border-border p-2 shadow-2xl flex flex-col gap-1 min-w-[140px] rounded-2xl">
                {Object.entries(MAP_THEMES).map(([key, theme]) => (
                  <button key={key} onClick={() => { setMapTheme(key as any); setIsThemeMenuOpen(false); }} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-black ${mapTheme === key ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
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
          <button onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)} className="w-12 h-12 rounded-2xl bg-background/95 border border-border shadow-2xl hover:scale-105 transition-all text-indigo-600 flex items-center justify-center"><Palette size={20} /></button>
        </div>

        <div className="bg-background/95 border border-border px-3 py-2 shadow-2xl rounded-2xl min-w-[60px] text-center">
          <div className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter mb-0.5">Zoom</div>
          <div className="text-[11px] font-black text-indigo-600 font-mono">{zoomPercent}%</div>
        </div>
      </div>
    </div>
  );
}
