"use client";

import Link from "next/link";
import { useIdle } from "./IdleProvider";

export default function DashboardHeader({ session }: { session: any }) {
  const { isMapPage } = useIdle();

  if (isMapPage) return null;

  const isAdmin = session?.user?.isAdmin || session?.user?.role === "admin";
  const href = isAdmin ? "/dashboard/audit" : (session ? "/profile" : "/login");

  return (
    <header 
      className="bg-white/75 backdrop-blur-[20px] border-b border-black/5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] h-[70px] flex justify-end items-center px-6 z-50 shrink-0 transition-all duration-500 ease-in-out"
    >
      <Link href={href} className="flex items-center gap-3 hover:bg-black/5 p-2 rounded-xl transition-colors cursor-pointer" title={isAdmin ? "Log Aktivitas Audit" : "Profil"}>
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#007AFF] font-bold text-sm">
          {session?.user?.name ? session.user.name.substring(0, 1).toUpperCase() : "G"}
        </div>
        <span className="text-sm font-semibold text-[#1d1d1f]">
          {session?.user?.name ? `Halo, ${session.user.name}` : "Guest (Belum Login)"}
        </span>
      </Link>
    </header>
  );
}
