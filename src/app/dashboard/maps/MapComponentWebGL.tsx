"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Map, { Marker, Popup, NavigationControl, FullscreenControl, useMap, Layer, Source, useControl } from "react-map-gl/maplibre";
import { MapboxOverlay } from '@deck.gl/mapbox';
import { H3HexagonLayer } from '@deck.gl/geo-layers';

function DeckGLOverlay(props: any) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useIdle } from "../IdleProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, Signal, Tv, Radio as RadioIcon, Navigation, Loader2, Globe, Map as MapIcon, Moon, Layers, Palette, MapPin, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { usePreferences } from "../PreferencesProvider";
import * as turf from '@turf/helpers';
import voronoi from '@turf/voronoi';
import bbox from '@turf/bbox';
import * as h3 from 'h3-js';
import circle from '@turf/circle';
import { GeoJsonLayer, ScatterplotLayer } from '@deck.gl/layers';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getBearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (x: number) => x * Math.PI / 180;
  const toDeg = (x: number) => x * 180 / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

const getAntennaAttenuation = (targetBearing: number, azimuths: number[], distanceMeters: number) => {
  let minAtten = 20; 
  const hpbw = 65; 
  for (const az of azimuths) {
    let diff = Math.abs(targetBearing - az);
    if (diff > 180) diff = 360 - diff;
    
    // Standard 3GPP Antenna Pattern
    const atten = 12 * Math.pow(diff / hpbw, 2);
    if (atten < minAtten) minAtten = atten;
  }
  
  // Smoothly blend downtilt leakage in the first 100 meters
  if (distanceMeters < 100) {
    const leakageFactor = distanceMeters / 100;
    return minAtten * leakageFactor;
  }
  
  return minAtten;
};

const pseudoRandomSeed = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const x = Math.sin(hash++) * 10000;
  return x - Math.floor(x);
};

const getFrequencyForOperator = (operatorName: string, seed: number): number => {
  const name = operatorName.toLowerCase();
  
  // Smartfren: primarily 850 MHz + 1800 + 2300
  if (name.includes('smartfren') || name.includes('smart')) {
    const options = [850, 1800, 2300];
    return options[Math.floor(seed * options.length)];
  }
  // Telkomsel: 900 + 1800 + 2100 + 2300
  if (name.includes('telkomsel') || name.includes('tsel') || name.includes('simpati') || name.includes('kartu as')) {
    const options = [900, 1800, 2100, 2300];
    return options[Math.floor(seed * options.length)];
  }
  // Indosat Ooredoo Hutchison (IOH): 900 + 1800 + 2100
  if (name.includes('indosat') || name.includes('ioh') || name.includes('im3') || name.includes('tri') || name.includes('hutchison') || name.includes('3') ) {
    const options = [900, 1800, 2100];
    return options[Math.floor(seed * options.length)];
  }
  // XL Axiata: 900 + 1800 + 2100
  if (name.includes('xl') || name.includes('axiata') || name.includes('axis')) {
    const options = [900, 1800, 2100];
    return options[Math.floor(seed * options.length)];
  }
  // Default / unknown: 1800 MHz (most universal)
  return 1800;
};

const getTowerParams = (id: string, localDensity: number = 0, operatorName: string = '') => {
  const seed = pseudoRandomSeed(id);
  const freq = getFrequencyForOperator(operatorName, seed);
  
  // Dynamic tower height based on spatial density
  let hTower = 45; // Default Rural/Suburban (Macro-cell)
  if (localDensity >= 5) {
    hTower = 15; // Dense Urban (Micro-cell / Rooftop)
  } else if (localDensity >= 2) {
    hTower = 25; // Urban
  }
  
  // Generate varied real-world sector configurations (Bi-sector, Tri-sector, Quad-sector)
  const numSectorsRoll = pseudoRandomSeed(id + "sectors");
  let numSectors = 3; // 70% chance of standard Tri-sector
  if (numSectorsRoll > 0.85) numSectors = 4; // 15% chance of Quad-sector (High capacity)
  else if (numSectorsRoll < 0.15) numSectors = 2; // 15% chance of Bi-sector (Highway/Valley coverage)
  
  const baseAzimuth = Math.floor(seed * 360);
  const azimuths = [];
  
  for (let i = 0; i < numSectors; i++) {
     const spacing = 360 / numSectors;
     const az = (baseAzimuth + (i * spacing)) % 360;
     azimuths.push(Math.round(az));
  }
  
  return { freq, hTower, azimuths };
};

const calculateOkumuraHataDbm = (distanceMeters: number, freqMHz: number, hTower: number) => {
  const txPower = 43; // 20W
  const antennaGain = 15; // dBi
  const urbanClutterLoss = 28; // dB (Dense Urban attenuation)
  const dKm = Math.max(0.01, distanceMeters / 1000); 
  const pathLoss = 69.55 + 26.16 * Math.log10(freqMHz) - 13.82 * Math.log10(hTower) + (44.9 - 6.55 * Math.log10(hTower)) * Math.log10(dKm);
  return Math.round(txPower + antennaGain - pathLoss - urbanClutterLoss);
};

const calcMaxDistanceKm = (freqMHz: number, hTower: number, targetDbm: number) => {
  const txPower = 43; 
  const antennaGain = 15; 
  const urbanClutterLoss = 28;
  const maxPathLoss = txPower + antennaGain - targetDbm - urbanClutterLoss;
  const term1 = 69.55 + 26.16 * Math.log10(freqMHz) - 13.82 * Math.log10(hTower);
  const term2 = 44.9 - 6.55 * Math.log10(hTower);
  const log10d = (maxPathLoss - term1) / term2;
  return Math.pow(10, log10d);
};

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
  const { mapTheme, setMapTheme, coordFormat, signalUnit, hexagonMode } = usePreferences();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [fullCoverageData, setFullCoverageData] = useState<any[] | null>(null);
  const [isComputingCoverage, setIsComputingCoverage] = useState(false);
  const [coverageProgress, setCoverageProgress] = useState(0);

  const [viewState, setViewState] = useState({
    longitude: 107.6098,
    latitude: -6.9147,
    zoom: 8,
    pitch: 0,
    bearing: 0
  });

  const formatCoordinate = (val: number, isLat: boolean, rawStr?: string) => {
    if (coordFormat === "decimal") return rawStr || val.toString();
    
    const absolute = Math.abs(val);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(1);
    
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
            
            if (closest) {
              if (closest.jenis?.toLowerCase().includes('tele') || closest.jenis?.toLowerCase().includes('seluler')) {
                const { freq, hTower } = getTowerParams(closest.id.toString());
                closest.dbm = calculateOkumuraHataDbm(minDiv, freq, hTower);
              } else {
                const baseRadius = closest.jenis === "Televisi" ? 10000 : (closest.jenis === "Radio Siaran" ? 5000 : 1000);
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

  const voronoiData = useMemo(() => {
    if (!showCoverage || markers.length === 0) return null;
    
    // Validasi koordinat dan pastikan unik
    const validMarkers = markers.filter(m => 
      m.lng !== undefined && m.lat !== undefined && 
      !isNaN(Number(m.lng)) && !isNaN(Number(m.lat))
    );

    const telcoMarkers = validMarkers.filter(m => 
      m.jenis?.toLowerCase().includes('tele') || 
      m.jenis?.toLowerCase().includes('seluler')
    );
    
    if (telcoMarkers.length < 3) return null;

    try {
      // Pastikan tidak ada koordinat duplikat yang bisa membingungkan algoritma Delaunay/Voronoi
      const seen = new Set();
      const uniqueMarkers = telcoMarkers.filter(m => {
        const key = `${m.lng},${m.lat}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const pointsArray = uniqueMarkers.map(m => turf.point([Number(m.lng), Number(m.lat)], { ...m }));

      // Turf.js Voronoi requires at least 3 points. If we have fewer, inject dummy points 
      // extremely far away to guarantee the algorithm works and the cell covers the entire map area.
      if (pointsArray.length === 1) {
        pointsArray.push(turf.point([Number(uniqueMarkers[0].lng) + 10, Number(uniqueMarkers[0].lat) + 10]));
        pointsArray.push(turf.point([Number(uniqueMarkers[0].lng) - 10, Number(uniqueMarkers[0].lat) - 10]));
      } else if (pointsArray.length === 2) {
        pointsArray.push(turf.point([Number(uniqueMarkers[0].lng) + 10, Number(uniqueMarkers[0].lat) - 10]));
      }

      const points = turf.featureCollection(pointsArray);
      
      const box = bbox(points);
      const paddedBox: [number, number, number, number] = [box[0] - 0.5, box[1] - 0.5, box[2] + 0.5, box[3] + 0.5];
      
      const polygons = voronoi(points, { bbox: paddedBox });
      
      // Filter poligon yang mungkin gagal dibuat (null)
      if (polygons && polygons.features) {
        polygons.features = polygons.features.filter(f => f && f.geometry);
      }
      
      console.log(`Voronoi generated with ${uniqueMarkers.length} points`, polygons);
      return polygons;
    } catch (e) {
      console.error("Voronoi calculation error:", e);
      return null;
    }
  }, [markers, showCoverage]);

  const processMarkerCoverage = useCallback((m: any, hexMap: globalThis.Map<string, { dbm: number, level: string }>, singlePolyMap: globalThis.Map<string, any>, allMarkers: any[], hexMode: string) => {
    const res = 9;
    const isTelco = m.jenis?.toLowerCase().includes('tele') || m.jenis?.toLowerCase().includes('seluler');
    const isRadio = m.jenis?.toLowerCase().includes('radio');
    const isTv = m.jenis?.toLowerCase().includes('televisi');
    
    const lng = Number(m.lng);
    const lat = Number(m.lat);
    
    const centerHex = h3.latLngToCell(lat, lng, res);
    
    if (isTelco) {
      // Use database values if they exist, otherwise fallback to pseudo-random generation
      const dbFreq = m.freq ? Number(m.freq) : undefined;
      const dbHTower = m.hTower ? Number(m.hTower) : undefined;
      const dbAzimuths = Array.isArray(m.azimuths) ? m.azimuths : undefined;

      let freq = dbFreq;
      let hTower = dbHTower;
      let azimuths = dbAzimuths;

      if (!freq || !hTower || !azimuths) {
        // Calculate local density (towers within 1km) for fallback calculation
        let localDensity = 0;
        for (const other of allMarkers) {
          if (other.id !== m.id) {
            const d = calculateDistance(lat, lng, Number(other.lat), Number(other.lng));
            if (d < 1000) localDensity++;
          }
        }
        const fallback = getTowerParams(m.id.toString(), localDensity, m.nama || '');
        freq = freq || fallback.freq;
        hTower = hTower || fallback.hTower;
        azimuths = azimuths || fallback.azimuths;
      }
      
      const maxRad = calcMaxDistanceKm(freq!, hTower!, -110);
      
      if (hexMode === 'single') {
         // Outer ring (Weak/Red)
         const polyOuter = circle([lng, lat], maxRad, {steps: 6, units: 'kilometers'});
         polyOuter.properties = { dbm: -110, level: 'outer', id: m.id.toString() + '_outer' };
         singlePolyMap.set(polyOuter.properties.id, polyOuter);

         // Mid ring (Medium/Yellow)
         const midRad = calcMaxDistanceKm(freq!, hTower!, -90);
         const polyMid = circle([lng, lat], midRad, {steps: 6, units: 'kilometers'});
         polyMid.properties = { dbm: -90, level: 'mid', id: m.id.toString() + '_mid' };
         singlePolyMap.set(polyMid.properties.id, polyMid);

         // Inner ring (Strong/Green)
         const innerRad = calcMaxDistanceKm(freq!, hTower!, -70);
         const polyInner = circle([lng, lat], innerRad, {steps: 6, units: 'kilometers'});
         polyInner.properties = { dbm: -65, level: 'inner', id: m.id.toString() + '_inner' };
         singlePolyMap.set(polyInner.properties.id, polyInner);
         
         return; // Skip grid disk calculations
      }
      
      const k = Math.min(25, Math.ceil(maxRad / 0.174));
      const rings = h3.gridDisk(centerHex, k);
      
      for (const hex of rings) {
         const [hLat, hLng] = h3.cellToLatLng(hex);
         const dMeters = calculateDistance(lat, lng, hLat, hLng);
         const omniDbm = calculateOkumuraHataDbm(dMeters, freq!, hTower!);
         
         const bearing = getBearing(lat, lng, hLat, hLng);
         const atten = getAntennaAttenuation(bearing, azimuths!, dMeters);
         
         const finalDbm = omniDbm - atten;
         
         if (finalDbm >= -110) {
            const existing = hexMap.get(hex);
            if (existing === undefined || finalDbm > existing.dbm) {
               let level = 'outer';
               if (finalDbm >= -75) level = 'inner';
               else if (finalDbm >= -90) level = 'mid';
               hexMap.set(hex, { dbm: finalDbm, level });
            }
         }
      }

      // ── Guarantee strong signal at tower foot (physics: 0m distance) ──────
      // Only force the center hex — no sector-neighbor stamps.
      // The monotonic enforcement pass (below) will prevent isolated green islands.
      const centerExisting = hexMap.get(centerHex);
      if (!centerExisting || centerExisting.dbm < -70) {
        hexMap.set(centerHex, { dbm: -65, level: 'inner' });
      }
    } else {
      const radiusMultiplierKm = isTv ? 10 : (isRadio ? 5 : 1);

      if (hexMode === 'single') {
         // Outer
         const polyOuter = circle([lng, lat], radiusMultiplierKm, {steps: 6, units: 'kilometers'});
         polyOuter.properties = { dbm: -110, level: 'outer', id: m.id.toString() + '_outer' };
         singlePolyMap.set(polyOuter.properties.id, polyOuter);

         // Mid
         const polyMid = circle([lng, lat], radiusMultiplierKm * 0.6, {steps: 6, units: 'kilometers'});
         polyMid.properties = { dbm: -90, level: 'mid', id: m.id.toString() + '_mid' };
         singlePolyMap.set(polyMid.properties.id, polyMid);

         // Inner
         const polyInner = circle([lng, lat], radiusMultiplierKm * 0.3, {steps: 6, units: 'kilometers'});
         polyInner.properties = { dbm: -65, level: 'inner', id: m.id.toString() + '_inner' };
         singlePolyMap.set(polyInner.properties.id, polyInner);

         return;
      }

      const k = Math.min(50, Math.ceil(radiusMultiplierKm / 0.174));
      const rings = h3.gridDisk(centerHex, k);
      
      for (const hex of rings) {
         const [hLat, hLng] = h3.cellToLatLng(hex);
         const dMeters = calculateDistance(lat, lng, hLat, hLng);
         const normalized = Math.max(0, 1 - dMeters / (radiusMultiplierKm * 1000));
         const dbm = -110 + Math.round(normalized * 60);
         
         if (dbm >= -110) {
            const existing = hexMap.get(hex);
            if (existing === undefined || dbm > existing.dbm) {
               let level = 'outer';
               if (dbm >= -75) level = 'inner';
               else if (dbm >= -90) level = 'mid';
               hexMap.set(hex, { dbm, level });
            }
         }
      }
    }
  }, []);

  // Async chunked calculation for full map to prevent UI freezing
  useEffect(() => {
    if (!showCoverage || markers.length === 0) {
      setFullCoverageData(null);
      return;
    }
    
    let isCancelled = false;
    
    const computeAsync = async () => {
      setIsComputingCoverage(true);
      setCoverageProgress(0);
      
      const validMarkers = markers.filter(m => 
        m.lng !== undefined && m.lat !== undefined && 
        !isNaN(Number(m.lng)) && !isNaN(Number(m.lat))
      );
      
      const hexMap = new globalThis.Map<string, { dbm: number, level: string }>();
      const singlePolyMap = new globalThis.Map<string, any>();
      const chunkSize = 20; // Process 20 towers per frame
      
      for (let i = 0; i < validMarkers.length; i += chunkSize) {
        if (isCancelled) return;
        
        const chunk = validMarkers.slice(i, i + chunkSize);
        chunk.forEach(m => processMarkerCoverage(m, hexMap, singlePolyMap, validMarkers, hexagonMode));
        
        setCoverageProgress(Math.round(((i + chunk.length) / validMarkers.length) * 100));
        
        // Yield execution back to the main thread so UI stays responsive
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      if (isCancelled) return;
      
      // ── Monotonic enforcement pass ─────────────────────────────────────────
      // A hex should never be stronger than ALL its ring-1 neighbors combined.
      // This prevents isolated green "islands" appearing inside yellow/red zones
      // (the physics reality: signal only weakens as you move away from the tower).
      hexMap.forEach((val, hex) => {
        if (val.level !== 'inner') return; // only check green cells for demotion
        const neighbors = h3.gridDisk(hex, 1).filter(n => n !== hex);
        const hasInnerNeighbor = neighbors.some(n => {
          const nVal = hexMap.get(n);
          return nVal && nVal.level === 'inner';
        });
        if (!hasInnerNeighbor) {
          // This green hex has no green neighbors — demote to mid
          hexMap.set(hex, { dbm: Math.min(val.dbm, -90), level: 'mid' });
        }
      });

      const data: any[] = [];
      if (hexagonMode === 'single') {
         singlePolyMap.forEach((val) => data.push(val));
      } else {
         hexMap.forEach((val, hex) => {
            data.push({ hex, dbm: val.dbm, level: val.level });
         });
      }
      
      setFullCoverageData(data);
      setIsComputingCoverage(false);
    };
    
    // Slight delay before starting to let the toggle animation finish smoothly
    const startTimer = setTimeout(() => {
      computeAsync();
    }, 50);
    
    return () => {
      clearTimeout(startTimer);
      isCancelled = true;
      setIsComputingCoverage(false);
    };
  }, [markers, showCoverage, processMarkerCoverage]);



  // Calculate single tower coverage instantly on click.
  const singleCoverageData = useMemo(() => {
    if (!showCoverage || !selectedPoint) return null;
    const validMarkers = [selectedPoint].filter(m => 
      m.lng !== undefined && m.lat !== undefined && 
      !isNaN(Number(m.lng)) && !isNaN(Number(m.lat))
    );
    
    const hexMap = new globalThis.Map<string, { dbm: number, level: string }>();
    const singlePolyMap = new globalThis.Map<string, any>();
    validMarkers.forEach(m => processMarkerCoverage(m, hexMap, singlePolyMap, markers, hexagonMode));
    
    const data: any[] = [];
    if (hexagonMode === 'single') {
       singlePolyMap.forEach((val) => data.push(val));
    } else {
       hexMap.forEach((val, hex) => {
          data.push({ hex, dbm: val.dbm, level: val.level });
       });
    }
    return data;
  }, [selectedPoint, showCoverage, processMarkerCoverage, hexagonMode]);

  // Switch between isolated view and full view without triggering recalculation of full map
  const coverageData = selectedPoint ? singleCoverageData : fullCoverageData;

  const deckLayers = useMemo(() => {
    if (renderMode !== 'point') return [];
    
    const layers = [];
    
    // 1. Draw Coverage (if enabled)
    if (showCoverage && coverageData) {
      // Smooth zoom opacity fade
      const zoomOpacity = viewState.zoom < 11 ? 0 : (viewState.zoom < 12 ? (viewState.zoom - 11) : 1);
      
      if (zoomOpacity > 0) {
        const isSingleMode = !!selectedPoint;
        
        const getColorForDbm = (dbm: number) => {
           const t = Math.max(0, Math.min(1, (dbm - (-115)) / ((-60) - (-115))));
           let r, g, b;
           if (t > 0.6) {
             r = 34; g = 197; b = 94; // Green
           } else if (t > 0.3) {
             r = 234; g = 179; b = 8; // Yellow
           } else {
             r = 239; g = 68; b = 68; // Red
           }
           const alphaFloor = isSingleMode ? 0.40 : 0.15;
           const alpha = Math.round((alphaFloor + t * (0.85 - alphaFloor)) * 255 * zoomOpacity);
           return [r, g, b, alpha];
        };

        if (hexagonMode === 'single') {
          layers.push(
            new GeoJsonLayer({
              id: 'geojson-coverage-layer',
              data: coverageData,
              pickable: true,
              stroked: false,
              filled: true,
              extruded: false,
              getFillColor: (d: any) => getColorForDbm(d.properties.dbm),
              updateTriggers: { getFillColor: [zoomOpacity, isSingleMode] }
            })
          );
        } else {
          layers.push(
            new H3HexagonLayer({
              id: 'h3-hexagon-layer',
              data: coverageData,
              pickable: true,
              wireframe: false,
              filled: true,
              extruded: true,
              elevationScale: 6,
              getHexagon: (d: any) => d.hex,
              getFillColor: (d: any) => getColorForDbm(d.dbm),
              getElevation: (d: any) => Math.max(0, d.dbm + 115),
              updateTriggers: { getFillColor: [zoomOpacity, isSingleMode] }
            })
          );
        }
      }
    }

    // 2. Draw Points ON TOP of coverage (only when showCoverage is true, otherwise MapLibre draws them)
    if (showCoverage) {
       layers.push(
         new ScatterplotLayer({
           id: 'deck-point-layer',
           data: markers.filter(m => m.lng !== undefined && m.lat !== undefined),
           pickable: false, // MapLibre handles clicks via transparent fallback layer
           getPosition: (d: any) => [Number(d.lng), Number(d.lat)],
           getFillColor: [79, 70, 229, 255], // indigo-600
           getLineColor: [255, 255, 255, 255],
           lineWidthMinPixels: 2,
           stroked: true,
           radiusUnits: 'pixels',
           getRadius: 5,
           radiusMinPixels: 3,
           radiusMaxPixels: 8,
         })
       );
    }
    
    return layers;
  }, [coverageData, showCoverage, renderMode, viewState.zoom, selectedPoint, hexagonMode, markers]);

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
        
        <DeckGLOverlay layers={deckLayers} interleaved={true} />
        
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

        {renderMode === 'point' && voronoiData && (
          <Source id="voronoi" type="geojson" data={voronoiData}>
            <Layer 
              id="voronoi-fill" 
              type="fill" 
              paint={{ 
                "fill-color": "#4f46e5", 
                "fill-opacity": 0.05,
                "fill-outline-color": "#4f46e5"
              }} 
            />
            <Layer 
              id="voronoi-line" 
              type="line" 
              paint={{ 
                "line-color": "#4f46e5", 
                "line-width": 2,
                "line-dasharray": [2, 2],
                "line-opacity": 0.8
              }} 
            />
          </Source>
        )}

        {/* Coverage GeoJSON source removed in favor of Deck.gl */}

        {renderMode === 'point' && (
          <Source id="points" type="geojson" data={{
            type: "FeatureCollection",
            features: markers
              .filter(m => m.lng !== undefined && m.lat !== undefined)
              .map(m => ({
                type: "Feature",
                geometry: { type: "Point", coordinates: [Number(m.lng), Number(m.lat)] },
                properties: { ...m }
              }))
          }}>
            <Layer 
              id="point-layer" 
              type="circle" 
              paint={{ 
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3, 15, 8], 
                "circle-color": showCoverage ? "transparent" : "#4f46e5", 
                "circle-stroke-width": showCoverage ? 0 : 2, 
                "circle-stroke-color": showCoverage ? "transparent" : "#ffffff" 
              }} 
            />
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
                  {formatCoordinate(selectedPoint.lat, true, selectedPoint.latStr)}, {formatCoordinate(selectedPoint.lng, false, selectedPoint.lngStr)}
                </div>
              </div>
              
              {(selectedPoint.hTower || selectedPoint.freq) && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100 bg-slate-50 p-2 rounded-lg border">
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
                    // MapLibre serializes arrays to JSON strings via GeoJSON properties — parse defensively
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

      {/* Floating HUD Outside Map component for safety */}
      <AnimatePresence>
        {isComputingCoverage && (
          <motion.div key="rf-calculator" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="absolute bottom-10 right-14 z-[2000]">
            <div className="bg-slate-900/95 backdrop-blur-xl text-white border border-slate-700/50 shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-2xl px-5 py-4 flex flex-col items-center gap-3 min-w-[240px]">
              <div className="flex items-center gap-3">
                <Loader2 size={18} className="animate-spin text-emerald-400" />
                <span className="text-sm font-semibold tracking-wide">Mengkalkulasi RF...</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden shadow-inner">
                <div className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full transition-all duration-300 ease-out" style={{ width: `${Math.max(2, coverageProgress)}%` }} />
              </div>
              <span className="text-[10px] text-slate-400 font-mono font-medium tracking-widest">{Math.min(100, coverageProgress)}% SELESAI</span>
            </div>
          </motion.div>
        )}
        
        {userLocation && nearestTower && (
          <motion.div key="hud-panel" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-6 left-1/2 -translate-x-1/2 z-[2000]">
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
        {showCoverage && hexagonMode === 'multi' && (
          <div className="bg-background/95 border border-border px-3 py-2 shadow-2xl rounded-2xl text-center">
            <div className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter mb-0.5">Skala</div>
            <div className="text-[11px] font-black text-emerald-600 font-mono">1 Heksagon ≈ 174m</div>
          </div>
        )}
      </div>
    </div>
  );
}
