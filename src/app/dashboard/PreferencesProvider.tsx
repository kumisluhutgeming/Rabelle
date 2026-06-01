"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type MapTheme = "colorful" | "voyager" | "dark" | "satellite";
type CoordFormat = "decimal" | "dms";
type SignalUnit = "dbm" | "percent";

interface PreferencesContextType {
  mapTheme: MapTheme;
  setMapTheme: (theme: MapTheme) => void;
  coordFormat: CoordFormat;
  setCoordFormat: (format: CoordFormat) => void;
  signalUnit: SignalUnit;
  setSignalUnit: (unit: SignalUnit) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [mapTheme, setMapTheme] = useState<MapTheme>("colorful");
  const [coordFormat, setCoordFormat] = useState<CoordFormat>("decimal");
  const [signalUnit, setSignalUnit] = useState<SignalUnit>("dbm");

  // Load from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("rabelle_map_theme") as MapTheme;
    const savedFormat = localStorage.getItem("rabelle_coord_format") as CoordFormat;
    const savedUnit = localStorage.getItem("rabelle_signal_unit") as SignalUnit;
    if (savedTheme) setMapTheme(savedTheme);
    if (savedFormat) setCoordFormat(savedFormat);
    if (savedUnit) setSignalUnit(savedUnit);
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem("rabelle_map_theme", mapTheme);
  }, [mapTheme]);

  useEffect(() => {
    localStorage.setItem("rabelle_coord_format", coordFormat);
  }, [coordFormat]);

  useEffect(() => {
    localStorage.setItem("rabelle_signal_unit", signalUnit);
  }, [signalUnit]);


  return (
    <PreferencesContext.Provider value={{ 
      mapTheme, setMapTheme, 
      coordFormat, setCoordFormat, 
      signalUnit, setSignalUnit
    }}>
      {children}
    </PreferencesContext.Provider>
  );
}
