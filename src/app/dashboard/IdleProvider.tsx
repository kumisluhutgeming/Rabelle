"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";

interface IdleContextType {
  isUiVisible: boolean;
  isMapPage: boolean;
  setHoverState: (isHovering: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

const IdleContext = createContext<IdleContextType>({ 
  isUiVisible: true, 
  isMapPage: false, 
  setHoverState: () => {},
  isSidebarCollapsed: false,
  setIsSidebarCollapsed: () => {}
});

export function useIdle() {
  return useContext(IdleContext);
}

export function IdleProvider({ children }: { children: ReactNode }) {
  const [isUiVisible, setIsUiVisible] = useState(true);
  const [isHoveringAny, setIsHoveringAny] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const isMapPage = pathname === "/dashboard/maps";

  useEffect(() => {
    if (!isMapPage) {
      setIsUiVisible(true);
      return;
    }

    if (isHoveringAny) {
      setIsUiVisible(true);
      return;
    }

    const timer = setTimeout(() => {
      setIsUiVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isMapPage, isHoveringAny]);

  // Global mouse tracker for hotzones
  useEffect(() => {
    if (!isMapPage) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Sidebar width is ~288px. Filter is ~280px wide placed next to sidebar.
      // Hotzone 1: Left side of screen (Sidebar area)
      // Hotzone 2: Top left of screen (Filter area)
      const isNearLeft = e.clientX < 320;
      const isNearTopLeft = e.clientX < 650 && e.clientY < 350;
      
      setIsHoveringAny(isNearLeft || isNearTopLeft);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMapPage]);

  const setHoverState = (isHovering: boolean) => {
    setIsHoveringAny(isHovering);
  };

  return (
    <IdleContext.Provider value={{ isUiVisible, isMapPage, setHoverState, isSidebarCollapsed, setIsSidebarCollapsed }}>
      {children}
    </IdleContext.Provider>
  );
}
