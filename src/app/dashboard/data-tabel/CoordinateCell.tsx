"use client";

import { usePreferences } from "../PreferencesProvider";

export default function CoordinateCell({ lat, lng, latStr, lngStr }: { lat: number, lng: number, latStr?: string, lngStr?: string }) {
  const { coordFormat } = usePreferences();

  if (coordFormat === "decimal") {
    // Return raw database strings if available to ensure absolutely zero rounding or truncation
    if (latStr && lngStr) {
      return (
        <span className="font-mono text-[10px] text-foreground/80 whitespace-nowrap">
          {latStr}, {lngStr}
        </span>
      );
    }
    // Fallback if strings aren't provided
    return (
      <span className="font-mono text-[10px] text-foreground/80 whitespace-nowrap">
        {lat.toFixed(7)}, {lng.toFixed(7)}
      </span>
    );
  }

  const formatCoordinate = (val: number, isLat: boolean) => {
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

  return (
    <span className="font-mono text-[10px] text-foreground/80 whitespace-nowrap">
      {formatCoordinate(lat, true)}, {formatCoordinate(lng, false)}
    </span>
  );
}
