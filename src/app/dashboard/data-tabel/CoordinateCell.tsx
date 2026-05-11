"use client";

import { usePreferences } from "../PreferencesProvider";

export default function CoordinateCell({ lat, lng }: { lat: number, lng: number }) {
  const { coordFormat } = usePreferences();

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

  return (
    <span className="font-mono text-[10px] text-foreground/80">
      {formatCoordinate(lat, true)}, {formatCoordinate(lng, false)}
    </span>
  );
}
