"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Map, { Marker, Popup, NavigationControl, FullscreenControl, Source, Layer, useControl } from "react-map-gl/maplibre";
import { MapboxOverlay } from '@deck.gl/mapbox';

import { GeoJsonLayer } from '@deck.gl/layers';
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as turf from '@turf/helpers';
import { useSearchParams } from "next/navigation";
import { MapPin, Navigation } from "lucide-react";

import { useIdle } from "../IdleProvider";
import { usePreferences } from "../PreferencesProvider";

import { calculateDistance, getTowerParams, calculateOkumuraHataDbm } from "@/lib/rf-propagation";
import { useSignalCoverage } from "./hooks/useSignalCoverage";

import MapControls, { MAP_THEMES } from "./components/MapControls";
import CheckSignalPanel from "./components/CheckSignalPanel";
import CoverageProgressOverlay from "./components/CoverageProgressOverlay";
import MapStatsOverlay from "./components/MapStatsOverlay";

function DeckGLOverlay(props: any) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

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
  "Kota Bogor": [106.8166, -6.5950],
  "Kota Surakarta": [110.8282, -7.5561],
  "Kota Malang": [112.6304, -7.9797],
  "Kota Tangerang Selatan": [106.7118, -6.2886],
  "Kabupaten Banyuwangi": [114.3639, -8.2120],
  "Kabupaten Sleman": [110.3392, -7.7126],
  "Kabupaten Bantul": [110.3298, -7.8885],
  "Kota Magelang": [110.2175, -7.4797]
};

export default function MapComponentWebGL({ locations = [] }: { locations: any[] }) {
  const { isUiVisible } = useIdle();
  const searchParams = useSearchParams();
  const { mapTheme, setMapTheme, coordFormat, signalUnit } = usePreferences();

  const [viewState, setViewState] = useState({
    longitude: 107.6098,
    latitude: -6.9147,
    zoom: 8,
    pitch: 0,
    bearing: 0
  });

  const [markers, setMarkers] = useState<any[]>([]);
  const [stats, setStats] = useState<{ province: Record<string, number>, kota: Record<string, number> }>({ province: {}, kota: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [nearestTower, setNearestTower] = useState<any | null>(null);
  const [showCoverage, setShowCoverage] = useState(false);

  const zoomPercent = Math.max(0, Math.min(100, Math.round(((viewState.zoom - 4.2) / (18.4 - 4.2)) * 100)));
  const renderMode = viewState.zoom < 8.4 ? 'province' : (viewState.zoom < 11.1 ? 'kota' : 'point');

  const { coverageData, isComputingCoverage, coverageProgress } = useSignalCoverage(
    markers,
    showCoverage,
    selectedPoint
  );

  const formatCoordinate = (val: number, isLat: boolean, rawStr?: string) => {
    if (coordFormat === "decimal") return rawStr || val.toString();
    const absolute = Math.abs(val);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(1);
    const direction = isLat ? (val >= 0 ? "N" : "S") : (val >= 0 ? "E" : "W");
    return `${degrees}°${minutes}'${seconds}" ${direction}`;
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
        setViewState(prev => ({
          ...prev,
          longitude: sumLng / newMarkers.length,
          latitude: sumLat / newMarkers.length,
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

  const handleCheckSignal = useCallback(() => {
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
          let closest: any = null;
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

          if (closest) {
            if (closest.jenis?.toLowerCase().includes('tele') || closest.jenis?.toLowerCase().includes('seluler')) {
              const { freq, hTower } = getTowerParams(closest.id.toString());
              closest.dbm = calculateOkumuraHataDbm(minDiv, freq, hTower);
            } else {
              const baseRadius = closest.jenis === "TV" ? 10000 : (closest.jenis === "Radio" ? 5000 : 1000);
              const normalized = Math.max(0, 1 - minDiv / baseRadius);
              closest.dbm = -110 + Math.round(normalized * 60);
            }
            setNearestTower(closest);
          }
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

  const deckLayers = useMemo(() => {
    if (renderMode !== 'point') return [];
    const layers = [];

    if (showCoverage && coverageData) {
      const zoomOpacity = viewState.zoom < 11 ? 0 : (viewState.zoom < 12 ? (viewState.zoom - 11) : 1);
      if (zoomOpacity > 0) {

        // NAH, INI YANG TADI KETINGGALAN:
        const isSingleMode = !!selectedPoint;

        const getColorForDbm = (dbm: number) => {
          let r, g, b;
          if (dbm <= -110) { r = 239; g = 68; b = 68; } // Merah
          else if (dbm <= -90) { r = 234; g = 179; b = 8; } // Kuning
          else { r = 34; g = 197; b = 94; } // Hijau

          const baseAlpha = isSingleMode ? 0.35 : 0.1;
          const alpha = Math.round(baseAlpha * 255 * zoomOpacity);

          return [r, g, b, alpha];
        };

        layers.push(
          new GeoJsonLayer({
            id: 'geojson-coverage-layer',
            data: coverageData,
            pickable: false,
            stroked: false,
            filled: true,
            extruded: false,
            getFillColor: ((d: any) => getColorForDbm(d.properties.dbm)) as any,
            updateTriggers: {
              getFillColor: [zoomOpacity, isSingleMode, coverageData]
            }
          })
        );
      }
    }
    return layers;
  }, [renderMode, showCoverage, coverageData, viewState.zoom, selectedPoint]);

  const maplibreglThemeUrl = (MAP_THEMES as any)[mapTheme]?.url || MAP_THEMES.voyager.url;

  const transformRequest = useCallback((url: string) => {
    if (url.includes("basemaps.cartocdn.com")) {
      // Rewrite tiles-a/b/c/d or a/b/c/d subdomains to the main basemaps.cartocdn.com domain.
      // This bypasses CORS issues on specific CDN edge nodes and prevents ad-blockers
      // from blocking vector tiles requests (since they often block tiles-d/tiles-a subdomains).
      const newUrl = url.replace(/https?:\/\/(tiles-[a-d]|[a-d])\.basemaps\.cartocdn\.com/, "https://basemaps.cartocdn.com");
      return { url: newUrl };
    }
    return { url };
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-100 dark:bg-slate-900">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        transformRequest={transformRequest}
        mapStyle={maplibreglThemeUrl}
        maxZoom={18.4}
        minZoom={4.2}
        maxBounds={[[94.0, -11.0], [141.0, 6.0]]}
        interactiveLayerIds={renderMode === 'point' ? ['markers-point'] : undefined}
        onClick={(e) => {
          if (renderMode === 'point') {
            if (e.features && e.features.length > 0) {
              const feature = e.features[0];
              const markerData = markers.find(m => m.id.toString() === feature.properties?.id?.toString());
              if (markerData) {
                setSelectedPoint(markerData);
              }
            } else {
              setSelectedPoint(null);
            }
          } else {
            setSelectedPoint(null);
          }
        }}
        cursor={renderMode === 'point' ? 'pointer' : 'grab'}
      >
        <NavigationControl position="bottom-right" />
        <FullscreenControl position="bottom-right" />

        {renderMode === 'point' && <DeckGLOverlay layers={deckLayers} interleaved={true} />}

        {renderMode === 'point' && markers.length > 0 && (
          <Source
            id="markers-source"
            type="geojson"
            data={{
              type: 'FeatureCollection',
              features: markers.filter(m => m.lng && m.lat).map(m => ({
                type: 'Feature',
                properties: { id: m.id, type: m.jenis },
                geometry: { type: 'Point', coordinates: [Number(m.lng), Number(m.lat)] }
              }))
            }}
          >
            <Layer
              id="markers-point"
              type="circle"
              paint={{
                'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 2, 12, 4, 16, 8],
                'circle-color': '#4f46e5',
                'circle-stroke-width': 1.5,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': 1,
                'circle-stroke-opacity': 1
              }}
            />
          </Source>
        )}

        {renderMode !== 'point' && clusterData.map((cluster: any, idx: number) => (
          <Marker
            key={`${renderMode}-${cluster.name}-${idx}`}
            longitude={cluster.lng}
            latitude={cluster.lat}
            anchor="bottom"
            onClick={e => {
              e.originalEvent.stopPropagation();
              setViewState(prev => ({
                ...prev,
                longitude: cluster.lng,
                latitude: cluster.lat,
                zoom: renderMode === 'province' ? 9.5 : 12,
                transitionDuration: 1000
              }));
            }}
          >
            <div className="flex flex-col items-center cursor-pointer group">
              <div className="bg-indigo-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-xl border border-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500 transition-all">
                <div className="text-[10px] uppercase tracking-widest font-bold opacity-80">{cluster.name}</div>
                <div className="text-lg font-black text-center">{cluster.count.toLocaleString()}</div>
              </div>
              <div className="w-1 h-4 bg-indigo-600/50" />
              <div className="w-3 h-3 bg-indigo-600 rounded-full border-2 border-white shadow-md animate-pulse" />
            </div>
          </Marker>
        ))}

        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-75"></div>
              <div className="relative w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg"></div>
            </div>
          </Marker>
        )}

        {selectedPoint && (
          <Popup
            longitude={Number(selectedPoint.lng)}
            latitude={Number(selectedPoint.lat)}
            anchor="bottom"
            onClose={() => setSelectedPoint(null)}
            closeButton={false}
            closeOnClick={false}
            offset={[0, -10]}
            className="z-[3000] rounded-2xl overflow-hidden shadow-2xl border-0"
            maxWidth="300px"
          >
            <div className="p-3 bg-white min-w-[240px]">
              <div className="flex gap-3 items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 border border-indigo-100">
                  <MapPin size={20} className="text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-slate-800 text-[13px] leading-tight mb-1">{selectedPoint.nama}</h3>
                  <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                    {selectedPoint.jenis}
                  </div>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-start gap-2">
                  <MapPin size={12} className="text-rose-500 mt-0.5 flex-shrink-0" />
                  <div className="text-[10px] font-medium text-slate-500">{selectedPoint.kota}, {selectedPoint.provinsi}</div>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <Navigation size={12} className="text-emerald-500" />
                  {formatCoordinate(selectedPoint.lat, true, selectedPoint.latStr)}, {formatCoordinate(selectedPoint.lng, false, selectedPoint.lngStr)}
                </div>
              </div>

              {(selectedPoint.hTower || selectedPoint.freq) && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100 bg-slate-50 p-2 rounded-lg border mt-2">
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Spesifikasi Menara</div>
                  {selectedPoint.freq && (
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Frekuensi</span>
                      <span className="font-mono font-medium text-slate-700">{selectedPoint.freq} MHz</span>
                    </div>
                  )}
                  {selectedPoint.hTower && (
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Tinggi Menara</span>
                      <span className="font-mono font-medium text-slate-700">{selectedPoint.hTower} m</span>
                    </div>
                  )}
                  {selectedPoint.azimuths && (() => {
                    const az = Array.isArray(selectedPoint.azimuths)
                      ? selectedPoint.azimuths
                      : (() => { try { return JSON.parse(selectedPoint.azimuths); } catch { return null; } })();
                    if (!az) return null;
                    return (
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Sektor Antena</span>
                        <span className="font-mono font-medium text-slate-700">{az.length} ({az.join('°, ')}°)</span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </Popup>
        )}
      </Map>

      <div className={`transition-opacity duration-300 ${isUiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <CoverageProgressOverlay
          isComputingCoverage={isComputingCoverage}
          coverageProgress={coverageProgress}
        />

        <CheckSignalPanel
          userLocation={userLocation}
          nearestTower={nearestTower}
          signalUnit={signalUnit}
          onRefresh={handleCheckSignal}
          onClose={() => setUserLocation(null)}
        />

        <MapStatsOverlay
          isLoading={isLoading}
          renderMode={renderMode}
          markersCount={markers.length}
        />
      </div>

      <MapControls
        showCoverage={showCoverage}
        setShowCoverage={setShowCoverage}
        mapTheme={mapTheme}
        setMapTheme={setMapTheme}
        zoomPercent={zoomPercent}
        onCheckSignal={handleCheckSignal}
        activeJenisFilter={searchParams.get('jenis')}
      />
    </div>
  );
}
