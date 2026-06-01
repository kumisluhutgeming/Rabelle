/**
 * rf-propagation.ts
 * 
 * Core mathematical models for Radio Frequency (RF) propagation,
 * path loss calculation, and geospatial utilities.
 */

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getBearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (x: number) => x * Math.PI / 180;
  const toDeg = (x: number) => x * 180 / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

export const getDestination = (lat: number, lon: number, distanceKm: number, bearingDeg: number) => {
  const R = 6371; // Earth radius in km
  const lat1 = lat * Math.PI / 180;
  const lon1 = lon * Math.PI / 180;
  const brng = bearingDeg * Math.PI / 180;

  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distanceKm / R) +
               Math.cos(lat1) * Math.sin(distanceKm / R) * Math.cos(brng));
               
  const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(distanceKm / R) * Math.cos(lat1),
                       Math.cos(distanceKm / R) - Math.sin(lat1) * Math.sin(lat2));

  return [lon2 * 180 / Math.PI, lat2 * 180 / Math.PI];
};

export const getAntennaAttenuation = (targetBearing: number, azimuths: number[], distanceMeters: number) => {
  if (!azimuths || azimuths.length === 0) return 0; // True omnidirectional for Radio/TV
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

export const pseudoRandomSeed = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const x = Math.sin(hash++) * 10000;
  return x - Math.floor(x);
};

export const getFrequencyForOperator = (operatorName: string, seed: number): number => {
  const name = operatorName.toLowerCase();
  
  if (name.includes('smartfren') || name.includes('smart')) {
    const options = [850, 1800, 2300];
    return options[Math.floor(seed * options.length)];
  }
  if (name.includes('telkomsel') || name.includes('tsel') || name.includes('simpati') || name.includes('kartu as')) {
    const options = [900, 1800, 2100, 2300];
    return options[Math.floor(seed * options.length)];
  }
  if (name.includes('indosat') || name.includes('ioh') || name.includes('im3') || name.includes('tri') || name.includes('hutchison') || name.includes('3') ) {
    const options = [900, 1800, 2100];
    return options[Math.floor(seed * options.length)];
  }
  if (name.includes('xl') || name.includes('axiata') || name.includes('axis')) {
    const options = [900, 1800, 2100];
    return options[Math.floor(seed * options.length)];
  }
  return 1800;
};

export const getTowerParams = (id: string, localDensity: number = 0, operatorName: string = '', type: 'telco' | 'radio' | 'tv' = 'telco') => {
  const seed = pseudoRandomSeed(id);

  if (type === 'radio') {
    return {
      freq: 100 + (seed * 8), // 100 - 108 MHz
      hTower: 60 + (seed * 40), // 60 - 100 meters
      azimuths: [], // Omni-directional
      txPower: 70, // 10,000 W (70 dBm)
    };
  }

  if (type === 'tv') {
    return {
      freq: 500 + (seed * 200), // UHF 500-700 MHz
      hTower: 80 + (seed * 150), // 80 - 230 meters
      azimuths: [], // Omni-directional
      txPower: 77, // 50,000 W (77 dBm)
    };
  }

  const freq = getFrequencyForOperator(operatorName, seed);
  
  let hTower = 45; 
  if (localDensity >= 5) {
    hTower = 15; 
  } else if (localDensity >= 2) {
    hTower = 25; 
  }
  
  const numSectorsRoll = pseudoRandomSeed(id + "sectors");
  let numSectors = 3; 
  if (numSectorsRoll > 0.85) numSectors = 4; 
  else if (numSectorsRoll < 0.15) numSectors = 2; 
  
  const baseAzimuth = Math.floor(seed * 360);
  const azimuths = [];
  
  for (let i = 0; i < numSectors; i++) {
     const spacing = 360 / numSectors;
     const az = (baseAzimuth + (i * spacing)) % 360;
     azimuths.push(Math.round(az));
  }
  
  return { freq, hTower, azimuths, txPower: 43 }; 
};

export const calculateOkumuraHataDbm = (distanceMeters: number, freqMHz: number, hTower: number, txPower: number = 43) => {
  const antennaGain = 15; // dBi
  const urbanClutterLoss = 28; // dB
  const dKm = Math.max(0.01, distanceMeters / 1000); 
  const pathLoss = 69.55 + 26.16 * Math.log10(freqMHz) - 13.82 * Math.log10(hTower) + (44.9 - 6.55 * Math.log10(hTower)) * Math.log10(dKm);
  return Math.round(txPower + antennaGain - pathLoss - urbanClutterLoss);
};

export const calcMaxDistanceKm = (freqMHz: number, hTower: number, targetDbm: number, txPower: number = 43) => {
  const antennaGain = 15; 
  const urbanClutterLoss = 28;
  const maxPathLoss = txPower + antennaGain - targetDbm - urbanClutterLoss;
  const term1 = 69.55 + 26.16 * Math.log10(freqMHz) - 13.82 * Math.log10(hTower);
  const term2 = 44.9 - 6.55 * Math.log10(hTower);
  const log10d = (maxPathLoss - term1) / term2;
  return Math.pow(10, log10d);
};
