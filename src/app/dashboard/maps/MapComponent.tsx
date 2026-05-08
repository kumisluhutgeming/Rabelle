"use client";

import { useEffect, useState, useMemo, Fragment, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, Polyline, useMapEvents, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useIdle } from "../IdleProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Map as MapIcon, Info, Signal, Wifi, Radio as RadioIcon, Tv, ChevronRight, X, Layers, Navigation, ExternalLink, Plus, Minus, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

const PROVINCE_CENTERS: Record<string, [number, number]> = {
  "Jawa Barat": [-6.9175, 107.6191],
  "Jawa Tengah": [-7.0051, 110.4381],
  "Jawa Timur": [-7.2575, 112.7521],
  "DKI Jakarta": [-6.2088, 106.8456],
  "Banten": [-6.1200, 106.1503],
  "DI Yogyakarta": [-7.7956, 110.3695],
  "Bali": [-8.3405, 115.0920]
};

const CITY_CENTERS: Record<string, [number, number]> = {
  "Kabupaten Lebak": [-6.3590, 106.2497],
  "Kabupaten Pandeglang": [-6.3086, 106.1045],
  "Kabupaten Serang": [-6.1150, 106.1503],
  "Kabupaten Tangerang": [-6.2257, 106.5085],
  "Kota Cilegon": [-6.0025, 106.0112],
  "Kota Serang": [-6.1200, 106.1503],
  "Kota Tangerang": [-6.1783, 106.6319],
  "Kota Tangerang Selatan": [-6.2886, 106.7179],
  "Kabupaten Kepulauan Seribu": [-5.7450, 106.6131],
  "Jakarta Barat": [-6.1683, 106.7588],
  "Jakarta Pusat": [-6.1865, 106.8341],
  "Jakarta Selatan": [-6.2615, 106.8106],
  "Jakarta Timur": [-6.2250, 106.9004],
  "Jakarta Utara": [-6.1380, 106.8636],
  "Kabupaten Bogor": [-6.4850, 106.8540],
  "Kabupaten Sukabumi": [-6.9181, 106.9310],
  "Kabupaten Cianjur": [-6.8173, 107.1425],
  "Kabupaten Bandung": [-7.0228, 107.5478],
  "Kabupaten Garut": [-7.2279, 107.9087],
  "Kabupaten Tasikmalaya": [-7.3274, 108.2207],
  "Kabupaten Ciamis": [-7.3257, 108.3534],
  "Kabupaten Kuningan": [-6.9754, 108.4838],
  "Kabupaten Cirebon": [-6.7063, 108.5570],
  "Kabupaten Majalengka": [-6.8364, 108.2271],
  "Kabupaten Sumedang": [-6.8576, 107.9208],
  "Kabupaten Indramayu": [-6.3264, 108.3200],
  "Kabupaten Subang": [-6.5717, 107.7596],
  "Kabupaten Purwakarta": [-6.5569, 107.4438],
  "Kabupaten Karawang": [-6.3054, 107.3006],
  "Kabupaten Bekasi": [-6.2416, 107.1485],
  "Kabupaten Bandung Barat": [-6.8652, 107.4828],
  "Kabupaten Pangandaran": [-7.7019, 108.4960],
  "Kota Bogor": [-6.5950, 106.8166],
  "Kota Sukabumi": [-6.9198, 106.9270],
  "Kota Bandung": [-6.9175, 107.6191],
  "Kota Cirebon": [-6.7320, 108.5523],
  "Kota Bekasi": [-6.2383, 106.9756],
  "Kota Depok": [-6.4025, 106.7942],
  "Kota Cimahi": [-6.8722, 107.5423],
  "Kota Tasikmalaya": [-7.3506, 108.2172],
  "Kota Banjar": [-7.3667, 108.5333],
  "Kabupaten Banjarnegara": [-7.4022, 109.6810],
  "Kabupaten Banyumas": [-7.4264, 109.2344],
  "Kabupaten Batang": [-6.9091, 109.7307],
  "Kabupaten Blora": [-6.9698, 111.4186],
  "Kabupaten Boyolali": [-7.5331, 110.5953],
  "Kabupaten Brebes": [-6.8731, 109.0439],
  "Kabupaten Cilacap": [-7.7320, 109.0060],
  "Kabupaten Demak": [-6.8900, 110.6390],
  "Kabupaten Grobogan": [-7.0217, 110.9158],
  "Kabupaten Jepara": [-6.5820, 110.6780],
  "Kabupaten Karanganyar": [-7.5961, 110.9500],
  "Kabupaten Kebumen": [-7.6689, 109.6531],
  "Kabupaten Kendal": [-6.9197, 110.2020],
  "Kabupaten Klaten": [-7.7058, 110.6061],
  "Kabupaten Kudus": [-6.8048, 110.8405],
  "Kabupaten Magelang": [-7.4797, 110.2177],
  "Kabupaten Pati": [-6.7487, 111.0380],
  "Kabupaten Pekalongan": [-6.8898, 109.6753],
  "Kabupaten Pemalang": [-6.8913, 109.3826],
  "Kabupaten Purbalingga": [-7.3900, 109.3639],
  "Kabupaten Purworejo": [-7.7139, 110.0080],
  "Kabupaten Rembang": [-6.7063, 111.3490],
  "Kabupaten Semarang": [-7.1390, 110.4050],
  "Kabupaten Sragen": [-7.4302, 111.0223],
  "Kabupaten Sukoharjo": [-7.6837, 110.8400],
  "Kabupaten Tegal": [-6.8797, 109.1256],
  "Kabupaten Temanggung": [-7.3167, 110.1667],
  "Kabupaten Wonogiri": [-7.8178, 110.9200],
  "Kabupaten Wonosobo": [-7.3630, 109.9000],
  "Kota Magelang": [-7.4706, 110.2177],
  "Kota Pekalongan": [-6.8886, 109.6753],
  "Kota Salatiga": [-7.3319, 110.4928],
  "Kota Semarang": [-6.9667, 110.4167],
  "Kota Surakarta": [-7.5666, 110.8167],
  "Kota Tegal": [-6.8694, 109.1402],
  "Kabupaten Bantul": [-7.8880, 110.3280],
  "Kabupaten Gunungkidul": [-7.9960, 110.6169],
  "Kabupaten Kulon Progo": [-7.8267, 110.1640],
  "Kabupaten Sleman": [-7.7163, 110.3556],
  "Kota Yogyakarta": [-7.7956, 110.3695],
  "Kabupaten Bangkalan": [-7.0455, 112.7351],
  "Kabupaten Banyuwangi": [-8.2192, 114.3691],
  "Kabupaten Blitar": [-8.0955, 112.1600],
  "Kabupaten Bojonegoro": [-7.1500, 111.8817],
  "Kabupaten Bondowoso": [-7.9135, 113.8214],
  "Kabupaten Gresik": [-7.1568, 112.6555],
  "Kabupaten Jember": [-8.1727, 113.7000],
  "Kabupaten Jombang": [-7.5459, 112.2330],
  "Kabupaten Kediri": [-7.8167, 112.0167],
  "Kabupaten Lamongan": [-7.1167, 112.4167],
  "Kabupaten Lumajang": [-8.1335, 113.2248],
  "Kabupaten Madiun": [-7.6298, 111.5239],
  "Kabupaten Magetan": [-7.6533, 111.3279],
  "Kabupaten Malang": [-8.0731, 112.6265],
  "Kabupaten Mojokerto": [-7.4722, 112.4336],
  "Kabupaten Nganjuk": [-7.6051, 111.9035],
  "Kabupaten Ngawi": [-7.4030, 111.4461],
  "Kabupaten Pacitan": [-8.1949, 111.1055],
  "Kabupaten Pamekasan": [-7.1568, 113.4746],
  "Kabupaten Pasuruan": [-7.6450, 112.9075],
  "Kabupaten Ponorogo": [-7.8650, 111.4667],
  "Kabupaten Probolinggo": [-7.7543, 113.2159],
  "Kabupaten Sampang": [-7.1881, 113.2395],
  "Kabupaten Sidoarjo": [-7.4478, 112.7183],
  "Kabupaten Situbondo": [-7.7062, 114.0098],
  "Kabupaten Sumenep": [-7.0048, 113.8590],
  "Kabupaten Trenggalek": [-8.0500, 111.7167],
  "Kabupaten Tuban": [-6.8976, 112.0649],
  "Kabupaten Tulungagung": [-8.0657, 111.9025],
  "Kota Batu": [-7.8717, 112.5283],
  "Kota Blitar": [-8.0983, 112.1681],
  "Kota Kediri": [-7.8480, 112.0178],
  "Kota Madiun": [-7.6298, 111.5239],
  "Kota Malang": [-7.9666, 112.6326],
  "Kota Mojokerto": [-7.4706, 112.4401],
  "Kota Pasuruan": [-7.6453, 112.9075],
  "Kota Probolinggo": [-7.7543, 113.2159],
  "Kota Surabaya": [-7.2575, 112.7521],
  "Kabupaten Badung": [-8.5810, 115.1770],
  "Kabupaten Bangli": [-8.4543, 115.3545],
  "Kabupaten Buleleng": [-8.1120, 115.0882],
  "Kabupaten Gianyar": [-8.5448, 115.3255],
  "Kabupaten Jembrana": [-8.3650, 114.6410],
  "Kabupaten Karangasem": [-8.4469, 115.6167],
  "Kabupaten Klungkung": [-8.5380, 115.4045],
  "Kabupaten Tabanan": [-8.5390, 115.1252],
  "Kota Denpasar": [-8.6705, 115.2126]
};

const getSafeIcon = (small: boolean) => {
  if (typeof window === 'undefined') return null;
  return new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: small ? [14, 22] : [22, 36],
    iconAnchor: small ? [7, 22] : [11, 36],
    popupAnchor: [1, -30],
    shadowSize: small ? [22, 22] : [36, 36],
  });
};

function MapEventsListener({ onBoundsChange, onZoomChange }: { onBoundsChange: (b: L.LatLngBounds) => void; onZoomChange: (z: number) => void; }) {
  const map = useMapEvents({
    moveend: () => { onBoundsChange(map.getBounds()); },
    zoomend: () => { onZoomChange(map.getZoom()); onBoundsChange(map.getBounds()); }
  });
  useEffect(() => { if (map) onBoundsChange(map.getBounds()); }, [map]);
  return null;
}

function FlyToPosition({ pos, zoom = 14 }: { pos: [number, number] | null, zoom?: number }) {
  const map = useMap();
  useEffect(() => { if (pos && map) map.flyTo(pos, zoom, { duration: 1.2 }); }, [pos, map, zoom]);
  return null;
}

function ZoomControlsCustom() {
  const map = useMap();
  return (
    <div className="flex flex-col gap-1">
      <button onClick={(e) => { e.stopPropagation(); map.zoomIn(); }} className="w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center text-slate-700 hover:bg-white shadow-sm border border-black/5 transition-transform active:scale-90"><Plus size={14} /></button>
      <button onClick={(e) => { e.stopPropagation(); map.zoomOut(); }} className="w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center text-slate-700 hover:bg-white shadow-sm border border-black/5 transition-transform active:scale-90"><Minus size={14} /></button>
    </div>
  );
}

export default function MapComponent({ markers: initialMarkers = [], locations = [] }: { markers: any[], locations: any[] }) {
  const { isSidebarCollapsed, isUiVisible } = useIdle();
  const searchParams = useSearchParams();
  const defaultCenter: [number, number] = [-6.9147, 107.6098];
  
  const [markers, setMarkers] = useState<any[]>(initialMarkers);
  const [stats, setStats] = useState<{province: Record<string, number>, kota: Record<string, number>}>({ province: {}, kota: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [nearestBts, setNearestBts] = useState<any | null>(null);
  const [currentZoom, setCurrentZoom] = useState(9);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  const [showCoverage, setShowCoverage] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeLayers, setActiveLayers] = useState({ seluler: true, tv: true, radio: true });

  const fetchTimeout = useRef<NodeJS.Timeout | null>(null);

  const zoomPercent = Math.max(0, Math.min(100, Math.round(((currentZoom - 5) / (18 - 5)) * 100)));
  const renderMode = zoomPercent < 30 ? 'province' : (zoomPercent < 60 ? 'kota' : 'point');

  const fetchViewportMarkers = useCallback(async (bounds: L.LatLngBounds) => {
    setIsLoading(true);
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const params = new URLSearchParams(searchParams.toString());
    params.set('minLat', sw.lat.toString()); params.set('maxLat', ne.lat.toString());
    params.set('minLng', sw.lng.toString()); params.set('maxLng', ne.lng.toString());
    try {
      const res = await fetch(`/api/markers?${params.toString()}`);
      const data = await res.json();
      if (data.markers) setMarkers(data.markers);
      if (data.stats) setStats(data.stats);
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  }, [searchParams]);

  useEffect(() => {
    if (!mapBounds) return;
    if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
    fetchTimeout.current = setTimeout(() => fetchViewportMarkers(mapBounds), 400);
    return () => { if (fetchTimeout.current) clearTimeout(fetchTimeout.current); };
  }, [mapBounds, fetchViewportMarkers]);

  const filteredMarkers = useMemo(() => markers.filter(m => {
    const t = m?.jenis?.toLowerCase() || '';
    if (t.includes('telekomunikasi') || t.includes('bts')) return activeLayers.seluler;
    if (t.includes('tv')) return activeLayers.tv;
    if (t.includes('radio')) return activeLayers.radio;
    return true;
  }), [markers, activeLayers]);

  // STABLE CLUSTERING LOGIC WITH PROXIMITY MERGING
  const groupedData = useMemo(() => {
    if (renderMode === 'point') return [];
    
    if (renderMode === 'province') {
      return Object.entries(PROVINCE_CENTERS)
        .map(([name, center]) => ({
          name,
          lat: center[0],
          lng: center[1],
          count: stats.province[name] || 0
        }))
        .filter(g => g.count > 0);
    } else {
      const cityGroups: Record<string, { lat: number, lng: number, count: number, name: string }> = {};
      
      // Proximity threshold to merge clusters (roughly ~5km)
      const MERGE_THRESHOLD = 0.08; 

      Object.entries(stats.kota).forEach(([name, count]) => {
        if (count > 0 && CITY_CENTERS[name]) {
          const [lat, lng] = CITY_CENTERS[name];
          
          // Check if there's an existing group very close
          let merged = false;
          for (const group of Object.values(cityGroups)) {
            const dist = Math.sqrt(Math.pow(group.lat - lat, 2) + Math.pow(group.lng - lng, 2));
            if (dist < MERGE_THRESHOLD) {
              group.count += count;
              merged = true;
              break;
            }
          }

          if (!merged) {
            cityGroups[name] = { name, lat, lng, count };
          }
        }
      });

      return Object.values(cityGroups);
    }
  }, [renderMode, stats]);

  const clusterIcon = useCallback((count: number, type: 'province' | 'kota') => {
    // Non-saturated colors: Indigo for Province, Slate for City
    const bgColor = type === 'province' ? 'rgba(79, 70, 229, 0.9)' : 'rgba(30, 41, 59, 0.85)';
    const size = type === 'province' ? 48 : 36;
    return L.divIcon({
      html: `<div style="background: ${bgColor}; width: ${size}px; height: ${size}px;" class="rounded-2xl border border-white/40 flex flex-col items-center justify-center text-white shadow-2xl backdrop-blur-md">
              <span class="text-[10px] font-black">${count > 999 ? (count/1000).toFixed(1) + 'k' : count}</span>
              <span class="text-[6px] font-bold opacity-70 uppercase tracking-tighter">${type === 'province' ? 'Prov' : 'Kab'}</span>
            </div>`,
      className: 'custom-cluster', iconSize: [size, size], iconAnchor: [size/2, size/2]
    });
  }, []);

  return (
    <div className="h-screen w-full relative z-0 bg-[#E5E7EB] overflow-hidden">
      {/* Search Omnibox */}
      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-[450px]">
        <div className="liquid-glass !rounded-[20px] shadow-lg">
          <div className="flex items-center px-4 py-3">
            {isLoading ? <Loader2 size={16} className="animate-spin text-indigo-500 mr-2.5" /> : <Search className="w-4 h-4 text-slate-400 mr-2.5" />}
            <input type="text" placeholder="Cari menara atau wilayah..." className="bg-transparent border-none outline-none w-full text-sm text-slate-800 font-semibold placeholder:text-slate-400" onFocus={() => setIsSearchFocused(true)} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
      </motion.div>

      {/* Side Info Panel */}
      <AnimatePresence>
        {selectedMarker && (
          <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} className="absolute top-0 right-0 h-full z-[1100] p-4 w-full max-w-[340px]">
            <div className="liquid-glass h-full shadow-2xl">
              <div className="relative h-36 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-600 to-indigo-800" />
                <button onClick={() => setSelectedMarker(null)} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full z-30"><X size={18} /></button>
                <div className="relative z-20 text-center px-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center mx-auto mb-2 border border-white/20"><Wifi size={24} className="text-white" /></div>
                  <h2 className="text-white font-black text-lg leading-tight">{selectedMarker.nama}</h2>
                </div>
              </div>
              <div className="p-5 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  {[
                    { label: 'Kategori', value: selectedMarker.jenis, icon: Layers, color: 'text-rose-500', bg: 'bg-rose-50' },
                    { label: 'Lokasi', value: `${selectedMarker.kota}, ${selectedMarker.provinsi}`, icon: Navigation, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                    { label: 'Koordinat', value: `${selectedMarker.lat}, ${selectedMarker.lng}`, icon: MapIcon, color: 'text-amber-500', bg: 'bg-amber-50', mono: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-[20px] bg-white/30 border border-white/40 shadow-sm">
                      <div className={`w-9 h-9 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}><item.icon size={16} /></div>
                      <div>
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.label}</div>
                        <div className={`text-xs font-black text-slate-700 ${item.mono ? 'font-mono' : ''}`}>{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full bg-slate-900 text-white p-4 rounded-[20px] text-xs font-black flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg"><ExternalLink size={14} /> Buka di Maps</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MapContainer 
        center={defaultCenter} zoom={9} minZoom={5} maxZoom={18}
        maxBounds={[[-11.0, 95.0], [6.0, 141.0]]} maxBoundsViscosity={1.0}
        zoomControl={false} preferCanvas={true} style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapEventsListener onBoundsChange={setMapBounds} onZoomChange={setCurrentZoom} />
        <FlyToPosition pos={selectedMarker ? [selectedMarker.lat, selectedMarker.lng] : (userPos || null)} />

        {renderMode !== 'point' && groupedData.map((group) => (
          <Marker key={`${renderMode}-${group.name}`} position={[group.lat, group.lng]} icon={clusterIcon(group.count, renderMode as any)} />
        ))}

        {renderMode === 'point' && filteredMarkers.map((marker) => {
          const isNearest = nearestBts && marker.id === nearestBts.id;
          const showRad = showCoverage && (userPos ? isNearest : true);
          return (
            <Fragment key={marker.id}>
              {showRad && [{r:1000,c:'#10b981'},{r:2000,c:'#f59e0b'},{r:3000,c:'#ef4444'}].map((cov, i) => (
                <Circle key={`${marker.id}-rad-${i}`} center={[marker.lat, marker.lng]} radius={cov.r} pathOptions={{ fillColor: cov.c, fillOpacity: 0.1, color: cov.c, weight: isNearest?1:0 }} />
              ))}
              <Marker position={[marker.lat, marker.lng]} icon={getSafeIcon(zoomPercent >= 30) || undefined} eventHandlers={{ click: () => setSelectedMarker(marker) }} />
            </Fragment>
          );
        })}
        
        {userPos && <Marker position={userPos} icon={new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', iconSize:[20,32], iconAnchor:[10,32] })} />}

        <div className={`leaflet-bottom leaflet-right z-[1000] p-6 pointer-events-auto flex flex-col items-end gap-3 transition-opacity duration-300 ${!isUiVisible ? "opacity-0" : "opacity-100"}`}>
          <div className="liquid-glass p-1 !rounded-2xl flex flex-row gap-1 shadow-lg pointer-events-auto">
            {[
              { key: 'seluler', icon: Signal, color: 'bg-emerald-500' },
              { key: 'tv', icon: Tv, color: 'bg-indigo-500' },
              { key: 'radio', icon: RadioIcon, color: 'bg-orange-500' },
            ].map((layer) => (
              <button key={layer.key} onClick={(e) => { e.stopPropagation(); setActiveLayers(l => ({ ...l, [layer.key]: !l[layer.key as keyof typeof l] })); }} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${activeLayers[layer.key as keyof typeof activeLayers] ? `${layer.color} text-white shadow-md` : 'bg-white/30 text-slate-400 opacity-50 hover:opacity-100'}`}><layer.icon size={14} /></button>
            ))}
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <button onClick={(e) => { e.stopPropagation(); setShowCoverage(!showCoverage); }} className={`liquid-glass px-4 py-2.5 !rounded-xl text-[11px] font-black transition-all flex items-center gap-2 border-none shadow-lg ${showCoverage ? "bg-slate-900 text-white" : "bg-white/80 text-slate-700"}`}><Layers size={14} /> {showCoverage ? "Radius: ON" : "Radius: OFF"}</button>
            <div className="liquid-glass px-3 py-2.5 !rounded-xl text-[10px] font-black text-slate-700 bg-white/80 shadow-lg min-w-[50px] text-center font-mono">{zoomPercent}%</div>
            <ZoomControlsCustom />
          </div>
        </div>
      </MapContainer>
    </div>
  );
}
