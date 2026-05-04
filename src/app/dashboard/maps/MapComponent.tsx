"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix missing marker icons
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

// Icon sizes for point markers – small when zoomed in (>= 30%), normal when zoomed out
const ICON_NORMAL: [number, number] = [25, 41];
const ICON_SMALL: [number, number] = [16, 26];

const makePointIcon = (small: boolean) => new L.Icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: small ? ICON_SMALL : ICON_NORMAL,
  iconAnchor: small ? [8, 26] : [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: small ? [26, 26] : [41, 41],
});

interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  nama: string;
  jenis: string;
  kota: string;
  provinsi?: string;
}

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Component to handle flying to user
function FlyToUser({ pos }: { pos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) {
      map.flyTo(pos, 13, { duration: 1.5 });
    }
  }, [pos, map]);
  return null;
}

// Component to track zoom level and bounds
function MapEventsListener({ 
  onZoomChange, 
  onBoundsChange 
}: { 
  onZoomChange: (z: number) => void;
  onBoundsChange: (b: L.LatLngBounds) => void;
}) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
      onBoundsChange(map.getBounds());
    },
    moveend: () => {
      onBoundsChange(map.getBounds());
    }
  });
  
  useEffect(() => {
    onZoomChange(map.getZoom());
    onBoundsChange(map.getBounds());
  }, [map, onZoomChange, onBoundsChange]);

  return null;
}

export default function MapComponent({ markers }: { markers: any[] }) {
  const defaultCenter: [number, number] = [-6.9147, 107.6098]; // Default to Bandung
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [nearestBts, setNearestBts] = useState<any | null>(null);
  const [signal, setSignal] = useState<{strength: string, distance: number, color: string} | null>(null);
  const [currentZoom, setCurrentZoom] = useState(9);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);

  const MIN_ZOOM = 5;
  const MAX_ZOOM = 18;
  const zoomPercent = Math.max(0, Math.min(100, Math.round(((currentZoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100)));

  // Determine render mode based on zoom percentage
  // < 30% : Province
  // 30% - 49% : Kab/Kota
  // >= 50% : Point
  const renderMode = zoomPercent < 30 ? 'province' : (zoomPercent < 50 ? 'kota' : 'point');

  const groupedByProvince = useMemo(() => {
    if (renderMode !== 'province') return [];
    const groups: Record<string, { latSum: number, lngSum: number, count: number, name: string }> = {};
    markers.forEach(m => {
      const prov = m.provinsi || 'Unknown';
      if (!groups[prov]) {
        groups[prov] = { latSum: 0, lngSum: 0, count: 0, name: prov };
      }
      groups[prov].latSum += m.lat;
      groups[prov].lngSum += m.lng;
      groups[prov].count += 1;
    });

    return Object.values(groups).map(g => ({
      lat: g.latSum / g.count,
      lng: g.lngSum / g.count,
      count: g.count,
      name: g.name
    }));
  }, [markers, renderMode]);

  const groupedByKota = useMemo(() => {
    if (renderMode !== 'kota') return [];
    const groups: Record<string, { latSum: number, lngSum: number, count: number, name: string }> = {};
    markers.forEach(m => {
      if (!groups[m.kota]) {
        groups[m.kota] = { latSum: 0, lngSum: 0, count: 0, name: m.kota };
      }
      groups[m.kota].latSum += m.lat;
      groups[m.kota].lngSum += m.lng;
      groups[m.kota].count += 1;
    });

    return Object.values(groups).map(g => ({
      lat: g.latSum / g.count,
      lng: g.lngSum / g.count,
      count: g.count,
      name: g.name
    }));
  }, [markers, renderMode]);

  // Cluster icon sizes scale with zoom level
  const clusterSize = zoomPercent < 30 ? 48 : (zoomPercent < 50 ? 34 : 24);
  const clusterFontSize = zoomPercent < 30 ? 14 : (zoomPercent < 50 ? 11 : 9);
  const clusterBorder = zoomPercent < 30 ? 3 : 2;

  const createClusterIcon = (count: number, type: 'province' | 'kota') => {
    const bgColor = type === 'province' ? 'rgba(220, 38, 38, 0.9)' : 'rgba(79, 70, 229, 0.9)';
    return L.divIcon({
      html: `<div style="background: ${bgColor}; backdrop-filter: blur(4px); color: white; font-weight: bold; border-radius: 9999px; width: ${clusterSize}px; height: ${clusterSize}px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.25); border: ${clusterBorder}px solid rgba(255,255,255,0.8); font-size: ${clusterFontSize}px;">${count}</div>`,
      className: 'custom-cluster-icon bg-transparent',
      iconSize: [clusterSize, clusterSize],
      iconAnchor: [clusterSize / 2, clusterSize / 2],
    });
  };

  // Viewport Culling: Only render markers that are currently visible on the screen
  // Point icon changes size based on zoom: small when zoomPercent >= 30
  const pointIcon = makePointIcon(zoomPercent >= 30);

  const visibleMarkers = useMemo(() => {
    if (renderMode !== 'point' || !mapBounds) return [];
    const extendedBounds = mapBounds.pad(0.1);
    return markers.filter(m => extendedBounds.contains([m.lat, m.lng]));
  }, [markers, mapBounds, renderMode]);

  const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  useEffect(() => {
    const handleCheck = () => {
      if (!navigator.geolocation) {
        alert("GPS tidak didukung oleh browser Anda.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const uLat = pos.coords.latitude;
          const uLng = pos.coords.longitude;
          setUserPos([uLat, uLng]);

          const btsMarkers = markers.filter(m => m.jenis === 'BTS');
          if (btsMarkers.length === 0) {
            alert("Tidak ada data menara BTS untuk mengukur sinyal.");
            return;
          }

          let minDist = Infinity;
          let nearest = null;
          btsMarkers.forEach(m => {
            const dist = getDistance(uLat, uLng, m.lat, m.lng);
            if (dist < minDist) {
              minDist = dist;
              nearest = m;
            }
          });

          if (nearest) {
            setNearestBts(nearest);
            let strength = "No Signal";
            let color = "text-red-500";
            if (minDist < 1) { strength = "Excellent"; color = "text-emerald-500"; }
            else if (minDist < 3) { strength = "Good"; color = "text-blue-500"; }
            else if (minDist < 5) { strength = "Fair"; color = "text-orange-500"; }
            else { strength = "Poor"; color = "text-red-500"; }
            
            setSignal({ strength, distance: minDist, color });
          }
        },
        (err) => alert("Gagal mendapatkan lokasi GPS. Pastikan izin lokasi diberikan.")
      );
    };

    window.addEventListener('checkSignal', handleCheck);
    return () => window.removeEventListener('checkSignal', handleCheck);
  }, [markers]);

  return (
    <div className="h-screen w-full overflow-hidden relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={9} 
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        maxBounds={[[-11.0, 95.0], [6.0, 141.0]]}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true} 
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapEventsListener onZoomChange={setCurrentZoom} onBoundsChange={setMapBounds} />

        {renderMode === 'province' && (
          groupedByProvince.map((group, idx) => (
            <Marker 
              key={`prov-${idx}`} 
              position={[group.lat, group.lng]}
              icon={createClusterIcon(group.count, 'province')}
            >
              <Popup>
                <div className="p-1 text-center">
                  <h3 className="font-bold text-slate-800 text-sm">{group.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">Total {group.count} Menara</p>
                  <p className="text-[10px] text-slate-400 italic mt-1">(Zoom in untuk melihat detail)</p>
                </div>
              </Popup>
            </Marker>
          ))
        )}

        {renderMode === 'kota' && (
          groupedByKota.map((group, idx) => (
            <Marker 
              key={`kota-${idx}`} 
              position={[group.lat, group.lng]}
              icon={createClusterIcon(group.count, 'kota')}
            >
              <Popup>
                <div className="p-1 text-center">
                  <h3 className="font-bold text-slate-800 text-sm">{group.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">Total {group.count} Menara</p>
                  <p className="text-[10px] text-slate-400 italic mt-1">(Zoom in untuk melihat detail)</p>
                </div>
              </Popup>
            </Marker>
          ))
        )}

        {renderMode === 'point' && (
          // Render ONLY individual markers that are within the current map bounds (Viewport Culling)
          visibleMarkers.map((marker) => (
            <Marker 
              key={marker.id} 
              position={[marker.lat, marker.lng]}
              icon={pointIcon}
            >
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <h3 className="font-bold text-slate-800 text-base mb-1">{marker.nama}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-700 uppercase tracking-wider">
                      {marker.jenis}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      {marker.kota}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono">
                    {marker.lat}, {marker.lng}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))
        )}
        
        {/* User GPS Marker */}
        {userPos && (
          <Marker position={userPos} icon={userIcon}>
            <Popup className="rounded-xl overflow-hidden shadow-lg">
              <div className="p-1">
                <h3 className="font-bold text-slate-800 text-[13px] border-b pb-1 mb-1">Lokasi Anda</h3>
                <p className="text-xs text-slate-500">Hasil Pengecekan Sinyal:</p>
                {signal && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    <span className={`font-bold text-[14px] ${signal.color}`}>{signal.strength}</span>
                    <span className="text-[10px] text-slate-400">Jarak ke BTS terdekat: {signal.distance.toFixed(2)} km</span>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Line from User to nearest BTS */}
        {userPos && nearestBts && (
          <Polyline 
            positions={[userPos, [nearestBts.lat, nearestBts.lng]]} 
            pathOptions={{ color: 'red', dashArray: '5, 10', weight: 2 }} 
          />
        )}

        <ZoomControl position="bottomright" />
        <FlyToUser pos={userPos} />
      </MapContainer>
      
      {/* Zoom Percentage Display */}
      <div className="absolute bottom-6 right-[60px] z-[400] pointer-events-none">
        <div className="bg-white/90 backdrop-blur shadow-md px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-700">
          {zoomPercent}%
        </div>
      </div>
    </div>
  );
}
