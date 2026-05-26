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

    const maxRad = calcMaxDistanceKm(freq!, hTower!, -110, txPower);
    
    if (hexMode === 'single') {
       const polyOuter = circle([lng, lat], maxRad, {steps: 6, units: 'kilometers'});
       polyOuter.properties = { dbm: -110, level: 'outer', id: m.id.toString() + '_outer' };
       singlePolyMap.set(polyOuter.properties.id, polyOuter);

       const midRad = calcMaxDistanceKm(freq!, hTower!, -90, txPower);
       const polyMid = circle([lng, lat], midRad, {steps: 6, units: 'kilometers'});
       polyMid.properties = { dbm: -90, level: 'mid', id: m.id.toString() + '_mid' };
       singlePolyMap.set(polyMid.properties.id, polyMid);

       const innerRad = calcMaxDistanceKm(freq!, hTower!, -70, txPower);
       const polyInner = circle([lng, lat], innerRad, {steps: 6, units: 'kilometers'});
       polyInner.properties = { dbm: -65, level: 'inner', id: m.id.toString() + '_inner' };
       singlePolyMap.set(polyInner.properties.id, polyInner);
       
       return; 
    }
    
    const edgeLengthKm = type === 'telco' ? 0.174 : 3.2; // res 9 ≈ 0.174 km, res 6 ≈ 3.2 km
    const kCap = type === 'telco' ? 25 : 40; // 40 rings of res 6 is ~128 km
    const k = Math.min(kCap, Math.ceil(maxRad / edgeLengthKm));
    const rings = h3.gridDisk(centerHex, k);
    
    for (const hex of rings) {
       const [hLat, hLng] = h3.cellToLatLng(hex);
       const dMeters = calculateDistance(lat, lng, hLat, hLng);
       const omniDbm = calculateOkumuraHataDbm(dMeters, freq!, hTower!, txPower);
       
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

    const centerExisting = hexMap.get(centerHex);
    if (!centerExisting || centerExisting.dbm < -70) {
      hexMap.set(centerHex, { dbm: -65, level: 'inner' });
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
    
    const data: any[] = [];
    if (hexagonMode === 'single') {
       singlePolyMap.forEach((val) => data.push(val));
    } else {
       hexMap.forEach((val, hex) => {
          data.push({ hex, dbm: val.dbm, level: val.level });
       });
    }
    return data;
  }, [selectedPoint, showCoverage, processMarkerCoverage, hexagonMode, markers]);

  const coverageData = selectedPoint ? singleCoverageData : fullCoverageData;

  return {
    coverageData,
    isComputingCoverage,
    coverageProgress
  };
}
