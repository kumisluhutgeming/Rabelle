"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIdle } from "./IdleProvider";
import LogoutButton from "./LogoutButton";
import { useTheme } from "next-themes";
import { LayoutDashboard, Map as MapIcon, Table, Settings, Home, ChevronLeft, ChevronRight, BarChart2, ClipboardList } from "lucide-react";

export default function Sidebar({ session }: { session: any }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const pathname = usePathname();
  const { isUiVisible, isMapPage, setHoverState, isSidebarCollapsed, setIsSidebarCollapsed } = useIdle();

  const opacityClass = isMapPage && !isUiVisible ? "opacity-0 pointer-events-none" : "opacity-100";
  const widthClass = isSidebarCollapsed ? "w-20" : "w-72";
  const positionClass = isMapPage ? "fixed left-0 top-0 bottom-0" : "sticky top-0";

  return (
    <aside 
      className={`bg-card border-r border-border ${positionClass} flex flex-col z-50 transition-all duration-300 ease-in-out ${widthClass} ${opacityClass} !rounded-r-2xl shadow-sm`}
    >
      <div className="p-8 flex items-center justify-between">
        {!isSidebarCollapsed ? (
          <Link href="/" className="flex items-center gap-3 overflow-hidden whitespace-nowrap group">
            <div className="w-11 h-11 flex items-center justify-center group-hover:scale-110 transition-transform">
              {mounted && theme === "dark" ? (
                <img src="/tacet-white.png" alt="Logo" className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-all" />
              ) : (
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
              )}
            </div>
            <span className="font-semibold text-lg tracking-tight text-foreground">Rabelle</span>
          </Link>
        ) : (
          <Link href="/" className="flex items-center justify-center w-full">
            <div className="w-11 h-11 flex items-center justify-center hover:scale-110 transition-transform">
              {mounted && theme === "dark" ? (
                <img src="/tacet-white.png" alt="Logo" className="w-full h-full object-contain opacity-90 transition-all" />
              ) : (
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain grayscale opacity-80 transition-all" />
              )}
            </div>
          </Link>
        )}
      </div>

      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="absolute -right-3 top-20 bg-card border border-border rounded-full p-1.5 shadow-sm hover:bg-muted transition-all z-50 text-muted-foreground hover:text-foreground"
      >
        {isSidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-8">
        <div>
          {!isSidebarCollapsed && <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 opacity-50">Utama</p>}
          <nav className="flex flex-col gap-1">
            <Link 
              href="/dashboard" 
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all font-medium text-sm ${pathname === "/dashboard" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
            >
              <LayoutDashboard size={18} className="shrink-0" />
              {!isSidebarCollapsed && <span>Ringkasan</span>}
            </Link>
            <Link 
              href="/dashboard/maps" 
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all font-medium text-sm ${pathname === "/dashboard/maps" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
            >
              <MapIcon size={18} className="shrink-0" />
              {!isSidebarCollapsed && <span>Peta Persebaran</span>}
            </Link>
            <Link 
              href="/dashboard/data-tabel" 
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all font-medium text-sm ${pathname === "/dashboard/data-tabel" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
            >
              <Table size={18} className="shrink-0" />
              {!isSidebarCollapsed && <span>Katalog Data</span>}
            </Link>
          </nav>
        </div>

        {session?.user?.isAdmin && (
          <div>
            {!isSidebarCollapsed && <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 opacity-50">Administrasi</p>}
            <nav className="flex flex-col gap-1">
              <Link 
                href="/dashboard/edit-data"
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all font-medium text-sm ${pathname === "/dashboard/edit-data" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
              >
                <Settings size={18} className="shrink-0" />
                {!isSidebarCollapsed && <span>Konfigurasi Data</span>}
              </Link>
              <Link 
                href="/dashboard/audit"
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all font-medium text-sm ${pathname === "/dashboard/audit" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
              >
                <ClipboardList size={18} className="shrink-0" />
                {!isSidebarCollapsed && <span>Log Aktivitas</span>}
              </Link>
            </nav>
          </div>
        )}
      </div>

      <div className="p-4">
        {session ? (
          <LogoutButton isCollapsed={isSidebarCollapsed} />
        ) : null}
      </div>
    </aside>
  );
}
