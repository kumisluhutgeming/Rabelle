import { useState, useEffect, useMemo, useCallback } from 'react';
import * as h3 from 'h3-js';
import circle from '@turf/circle';
import {
  calculateDistance,
  getBearing,
  getAntennaAttenuation,
  getTowerParams,
  calculateOkumuraHataDbm,
  calcMaxDistanceKm
} from '@/lib/rf-propagation';

export function useSignalCoverage(
  markers: any[],
  showCoverage: boolean,
  hexagonMode: string,
  selectedPoint: any | null
) {
  const [fullCoverageData, setFullCoverageData] = useState<any[] | null>(null);
  const [isComputingCoverage, setIsComputingCoverage] = useState(false);
  const [coverageProgress, setCoverageProgress] = useState(0);

  const processMarkerCoverage = useCallback((m: any, hexMap: globalThis.Map<string, { dbm: number, level: string }>, singlePolyMap: globalThis.Map<string, any>, allMarkers: any[], hexMode: string) => {
    const isRadio = m.jenis?.toLowerCase().includes('radio');
    const isTv = m.jenis?.toLowerCase().includes('televisi') || m.jenis?.toLowerCase().includes('tv');
    const type = isRadio ? 'radio' : (isTv ? 'tv' : 'telco');

    const lng = Number(m.lng);
    const lat = Number(m.lat);
    const res = type === 'telco' ? 9 : 6;
    const centerHex = h3.latLngToCell(lat, lng, res);

    const dbFreq = m.freq ? Number(m.freq) : undefined;
    const dbHTower = m.hTower ? Number(m.hTower) : undefined;
    const dbAzimuths = Array.isArray(m.azimuths) ? m.azimuths : undefined;

    let freq = dbFreq;
    let hTower = dbHTower;
    let azimuths = dbAzimuths;
    let txPower = type === 'radio' ? 70 : (type === 'tv' ? 77 : 43);

    if (!freq || !hTower || (!azimuths && type === 'telco')) {
      let localDensity = 0;
      if (type === 'telco') {
        for (const other of allMarkers) {
          if (other.id !== m.id) {
            const d = calculateDistance(lat, lng, Number(other.lat), Number(other.lng));
            if (d < 1000) localDensity++;
          }
        }
      }
      const fallback = getTowerParams(m.id.toString(), localDensity, m.nama || '', type);
      freq = freq || fallback.freq;
      hTower = hTower || fallback.hTower;
      azimuths = azimuths || fallback.azimuths;
      txPower = fallback.txPower;
    }

    if (!azimuths || azimuths.length === 0) azimuths = type === 'telco' ? [0, 90, 180, 270] : [];

    // --- MULAI PASTE DARI SINI ---
    // Urutan PENTING: Dari radius terbesar ke terkecil agar tidak saling menutupi
    const signalLevels = [
      { dbm: -110 }, // Merah (Radius Terbesar, ditaruh paling bawah)
      { dbm: -90 },  // Kuning (Radius Menengah)
      { dbm: -70 }   // Hijau (Radius Terkecil, center pas di titik tower)
    ];

    for (let i = 0; i < signalLevels.length; i++) {
      const { dbm } = signalLevels[i];

      // Hitung radius asli pakai rumus bawaan
      let rad = calcMaxDistanceKm(freq!, hTower!, dbm, txPower);

      // --- PENYESUAIAN REALISTIS ---
      if (type === 'telco') {
        // Di dunia nyata, sinyal Telco drop sangat cepat karena redaman gedung/kontur.
        // Kita tekan radiusnya secara proporsional. 
        // Misalnya, dbm -70 (Hijau) maksimal 1-2 km, dbm -110 (Merah) maksimal 5-7 km.
        const realismMultiplier = 0.15; // Ambil 15% dari jarak teoretis hampa udara
        rad = rad * realismMultiplier;

        // Hard cap (batasan maksimal mutlak) agar tidak ada tower telco yang aneh
        if (rad > 8) rad = 8;
      } else if (type === 'tv' || type === 'radio') {
        // TV & Radio memang luas, tapi kita sedikit optimasi visualnya
        const realismMultiplier = 0.6; // Ambil 60%
        rad = rad * realismMultiplier;
      }
      // -----------------------------

      if (rad > 0) {
        const poly = circle([lng, lat], rad, { steps: 6, units: 'kilometers' });
        poly.properties = { dbm: dbm, level: 'gradient', id: `${m.id}_${i}` };
        singlePolyMap.set(poly.properties.id, poly);
      }
    }
  }, []);

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
        const chunkSize = 20;

        for (let i = 0; i < validMarkers.length; i += chunkSize) {
          if (isCancelled) return;

          const chunk = validMarkers.slice(i, i + chunkSize);
          chunk.forEach(m => processMarkerCoverage(m, hexMap, singlePolyMap, validMarkers, hexagonMode));

          setCoverageProgress(Math.round(((i + chunk.length) / validMarkers.length) * 100));

          await new Promise(resolve => setTimeout(resolve, 0));
        }

        if (isCancelled) return;

        hexMap.forEach((val, hex) => {
          if (val.level !== 'inner') return;
          const neighbors = h3.gridDisk(hex, 1).filter(n => n !== hex);
          const hasInnerNeighbor = neighbors.some(n => {
            const nVal = hexMap.get(n);
            return nVal && nVal.level === 'inner';
          });
          if (!hasInnerNeighbor) {
            hexMap.set(hex, { dbm: Math.min(val.dbm, -90), level: 'mid' });
          }
        });

        // HAPUS blok if (hexagonMode === 'single') lama, ganti jadi ini:
        const data: any[] = [];
        singlePolyMap.forEach((val) => data.push(val));
        setFullCoverageData(data);
      };

      const startTimer = setTimeout(() => {
        computeAsync();
      }, 50);

      return () => {
        clearTimeout(startTimer);
        isCancelled = true;
        setIsComputingCoverage(false);
      };
    }, [markers, showCoverage, processMarkerCoverage, hexagonMode]);

    const singleCoverageData = useMemo(() => {
      if (!showCoverage || !selectedPoint) return null;
      const validMarkers = [selectedPoint].filter(m =>
        m.lng !== undefined && m.lat !== undefined &&
        !isNaN(Number(m.lng)) && !isNaN(Number(m.lat))
      );

      const hexMap = new globalThis.Map<string, { dbm: number, level: string }>();
      const singlePolyMap = new globalThis.Map<string, any>();
      validMarkers.forEach(m => processMarkerCoverage(m, hexMap, singlePolyMap, markers, hexagonMode));

      // HAPUS blok if (hexagonMode === 'single') lama, ganti jadi ini:
      const data: any[] = [];
      singlePolyMap.forEach((val) => data.push(val));
      return data;
    }, [selectedPoint, showCoverage, processMarkerCoverage, hexagonMode, markers]);

    const coverageData = selectedPoint ? singleCoverageData : fullCoverageData;

    return {
      coverageData,
      isComputingCoverage,
      coverageProgress
    };
  }
