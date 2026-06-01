import { useState, useEffect, useMemo, useCallback } from 'react';
import { polygon } from '@turf/helpers';
import {
  calculateDistance,
  getTowerParams,
  calcMaxDistanceKm,
  getDestination
} from '@/lib/rf-propagation';

export function useSignalCoverage(
  markers: any[],
  showCoverage: boolean,
  selectedPoint: any | null
) {
  const [fullCoverageData, setFullCoverageData] = useState<any[] | null>(null);
  const [isComputingCoverage, setIsComputingCoverage] = useState(false);
  const [coverageProgress, setCoverageProgress] = useState(0);

  const processMarkerCoverage = useCallback((m: any, singlePolyMap: globalThis.Map<string, any>, allMarkers: any[]) => {
    const isRadio = m.jenis?.toLowerCase().includes('radio');
    const isTv = m.jenis?.toLowerCase().includes('televisi') || m.jenis?.toLowerCase().includes('tv');
    const type = isRadio ? 'radio' : (isTv ? 'tv' : 'telco');

    const lng = Number(m.lng);
    const lat = Number(m.lat);

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
    
    let baseAzimuth = 0;
    if (azimuths && azimuths.length > 0) {
      baseAzimuth = azimuths[0];
    }

    // Urutan PENTING: Dari radius terbesar ke terkecil agar tidak saling menutupi
    const signalLevels = [
      { dbm: -110 }, // Merah (Radius Terbesar)
      { dbm: -90 },  // Kuning
      { dbm: -70 }   // Hijau (Radius Terkecil)
    ];

    for (let i = 0; i < signalLevels.length; i++) {
      const { dbm } = signalLevels[i];

      // Hitung radius asli pakai rumus bawaan Okumura-Hata
      let rad = calcMaxDistanceKm(freq!, hTower!, dbm, txPower);

      if (rad > 0) {
        // Mencegah WebGL crash untuk radius yang tidak wajar akibat kombinasi power yang ekstrem
        if (rad > 150) rad = 150; 
        
        const coords = [];
        for (let j = 0; j <= 6; j++) {
           const angle = (baseAzimuth + (j * 60)) % 360;
           coords.push(getDestination(lat, lng, rad, angle));
        }
        // Pastikan point terakhir sama persis dengan point pertama untuk validitas ring polygon
        coords[6] = [...coords[0]];
        
        const poly = polygon([coords]);
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

      const singlePolyMap = new globalThis.Map<string, any>();
      const chunkSize = 20;

      for (let i = 0; i < validMarkers.length; i += chunkSize) {
        if (isCancelled) return;

        const chunk = validMarkers.slice(i, i + chunkSize);
        chunk.forEach(m => processMarkerCoverage(m, singlePolyMap, validMarkers));

        setCoverageProgress(Math.round(((i + chunk.length) / validMarkers.length) * 100));

        await new Promise(resolve => setTimeout(resolve, 0));
      }

      if (isCancelled) return;

      const data: any[] = [];
      singlePolyMap.forEach((val) => data.push(val));
      setFullCoverageData(data);
      setIsComputingCoverage(false);
    };

    const startTimer = setTimeout(() => {
      computeAsync();
    }, 50);

    return () => {
      clearTimeout(startTimer);
      isCancelled = true;
      setIsComputingCoverage(false);
    };
  }, [markers, showCoverage, processMarkerCoverage]);

  const singleCoverageData = useMemo(() => {
    if (!showCoverage || !selectedPoint) return null;
    const validMarkers = [selectedPoint].filter(m =>
      m.lng !== undefined && m.lat !== undefined &&
      !isNaN(Number(m.lng)) && !isNaN(Number(m.lat))
    );

    const singlePolyMap = new globalThis.Map<string, any>();
    validMarkers.forEach(m => processMarkerCoverage(m, singlePolyMap, markers));

    const data: any[] = [];
    singlePolyMap.forEach((val) => data.push(val));
    return data;
  }, [selectedPoint, showCoverage, processMarkerCoverage, markers]);

  const coverageData = selectedPoint ? singleCoverageData : fullCoverageData;

  return {
    coverageData,
    isComputingCoverage,
    coverageProgress
  };
}
