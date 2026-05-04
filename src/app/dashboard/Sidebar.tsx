"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIdle } from "./IdleProvider";
import LogoutButton from "./LogoutButton";
import { LayoutDashboard, Map as MapIcon, Table, Settings, Home, ChevronLeft, ChevronRight } from "lucide-react";

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
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path></svg>
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-800">Rabel<span className="text-sky-600">le</span></span>
          </Link>
        ) : (
          <Link href="/" className="flex items-center justify-center w-full">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <span className="font-bold text-white text-lg">R</span>
            </div>
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
            title="Beranda Dashboard"
            className={`flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${pathname === "/dashboard" ? "bg-sky-50 text-sky-600" : "text-slate-600 hover:bg-black/5"}`}
          >
            <LayoutDashboard size={20} className="shrink-0" />
            {!isSidebarCollapsed && <span className="whitespace-nowrap">Beranda Dashboard</span>}
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
        </nav>
      </div>

      <div className="border-t border-black/5 my-4"></div>

      <div className="flex flex-col gap-2 px-3 pb-6">
        {session ? (
          <>
            {session?.user?.isAdmin && (
              <Link 
                href="/dashboard/edit-data"
                className={`flex items-center gap-3 p-3 rounded-xl transition-all w-full font-medium mb-2 ${pathname === "/dashboard/edit-data" ? "bg-indigo-100 text-indigo-700" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}
              >
                <Settings size={20} className="shrink-0" />
                {!isSidebarCollapsed && <span className="whitespace-nowrap">Edit Data</span>}
              </Link>
            )}
            <LogoutButton isCollapsed={isSidebarCollapsed} />
          </>
        ) : null}
        <Link 
          href="/" 
          title="Kembali ke Beranda"
          className="flex items-center justify-center gap-3 p-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all w-full font-medium mt-2 pointer-events-auto"
        >
          <Home size={20} className="shrink-0" />
          {!isSidebarCollapsed && <span className="whitespace-nowrap">Ke Beranda</span>}
        </Link>
      </div>
    </aside>
  );
}
