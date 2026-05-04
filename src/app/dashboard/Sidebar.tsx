"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIdle } from "./IdleProvider";
import LogoutButton from "./LogoutButton";
import { LayoutDashboard, Map as MapIcon, Table, Settings, Home, ChevronLeft, ChevronRight, BarChart2, ClipboardList } from "lucide-react";

export default function Sidebar({ session }: { session: any }) {
  const pathname = usePathname();
  const { isUiVisible, isMapPage, setHoverState, isSidebarCollapsed, setIsSidebarCollapsed } = useIdle();

  const opacityClass = isMapPage && !isUiVisible ? "opacity-0 pointer-events-none" : "opacity-100";
  const widthClass = isSidebarCollapsed ? "w-20" : "w-72";
  const positionClass = isMapPage ? "fixed left-0 top-0 bottom-0" : "sticky top-0";

  return (
    <aside 
      className={`bg-white/80 backdrop-blur-xl border-r border-black/5 shadow-sm h-screen ${positionClass} flex flex-col z-50 transition-all duration-500 ease-in-out ${widthClass} ${opacityClass}`}
    >
      <div className="p-6 flex items-center justify-between">
        {!isSidebarCollapsed ? (
          <Link href="/" className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 shrink-0 object-contain" />
            <span className="font-extrabold text-3xl tracking-tight text-slate-800">Rabel<span className="text-sky-600">le</span></span>
          </Link>
        ) : (
          <Link href="/" className="flex items-center justify-center w-full">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 shrink-0 object-contain" />
          </Link>
        )}
      </div>

      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="absolute -right-3 top-20 bg-white border border-slate-200 rounded-full p-1 shadow-md hover:bg-slate-50 transition-colors z-50 text-slate-500 pointer-events-auto"
      >
        {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className="flex-1 overflow-y-auto py-4 px-3 overflow-x-hidden">
        {!isSidebarCollapsed && <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Menu Utama</p>}
        <nav className="flex flex-col gap-2">
          <Link 
            href="/dashboard" 
            title="Home"
            className={`flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${pathname === "/dashboard" ? "bg-sky-50 text-sky-600" : "text-slate-600 hover:bg-black/5"}`}
          >
            <LayoutDashboard size={20} className="shrink-0" />
            {!isSidebarCollapsed && <span className="whitespace-nowrap">Home</span>}
          </Link>
          <Link 
            href="/dashboard/maps" 
            title="Peta Persebaran"
            className={`flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${pathname === "/dashboard/maps" ? "bg-sky-50 text-sky-600" : "text-slate-600 hover:bg-black/5"}`}
          >
            <MapIcon size={20} className="shrink-0" />
            {!isSidebarCollapsed && <span className="whitespace-nowrap">Peta Persebaran</span>}
          </Link>
          <Link 
            href="/dashboard/data-tabel" 
            title="Tabel Data"
            className={`flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${pathname === "/dashboard/data-tabel" ? "bg-sky-50 text-sky-600" : "text-slate-600 hover:bg-black/5"}`}
          >
            <Table size={20} className="shrink-0" />
            {!isSidebarCollapsed && <span className="whitespace-nowrap">Tabel Data</span>}
          </Link>
          <Link 
            href="/dashboard/analytics" 
            title="Analitik Tren"
            className={`flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${pathname === "/dashboard/analytics" ? "bg-sky-50 text-sky-600" : "text-slate-600 hover:bg-black/5"}`}
          >
            <BarChart2 size={20} className="shrink-0" />
            {!isSidebarCollapsed && <span className="whitespace-nowrap">Analitik Tren</span>}
          </Link>
        </nav>
      </div>

      <div className="border-t border-black/5 my-4"></div>

      <div className="flex flex-col gap-2 px-3 pb-6">
        {session ? (
          <>
            {session?.user?.isAdmin && (
              <>
                <Link 
                  href="/dashboard/edit-data"
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all w-full font-medium mb-1 ${pathname === "/dashboard/edit-data" ? "bg-indigo-100 text-indigo-700" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}
                >
                  <Settings size={20} className="shrink-0" />
                  {!isSidebarCollapsed && <span className="whitespace-nowrap">Edit Data</span>}
                </Link>
                <Link 
                  href="/dashboard/audit"
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all w-full font-medium mb-2 ${pathname === "/dashboard/audit" ? "bg-amber-100 text-amber-700" : "bg-amber-50 text-amber-600 hover:bg-amber-100"}`}
                >
                  <ClipboardList size={20} className="shrink-0" />
                  {!isSidebarCollapsed && <span className="whitespace-nowrap">Log Aktivitas</span>}
                </Link>
              </>
            )}
            <LogoutButton isCollapsed={isSidebarCollapsed} />
          </>
        ) : null}
      </div>
    </aside>
  );
}
