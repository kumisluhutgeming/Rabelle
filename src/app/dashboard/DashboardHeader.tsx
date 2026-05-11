"use client";

import Link from "next/link";
import { useIdle } from "./IdleProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function DashboardHeader({ session }: { session: any }) {
  const { isMapPage } = useIdle();

  if (isMapPage) return null;

  const isAdmin = session?.user?.isAdmin || session?.user?.role === "admin";
  const href = isAdmin ? "/dashboard/audit" : (session ? "/profile" : "/login");

  return (
    <header 
      className="bg-card border-b border-border h-16 flex justify-end items-center px-8 gap-6 z-50 shrink-0 !rounded-b-2xl shadow-sm"
    >
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="w-[1px] h-4 bg-border" />
        <Link href={href} className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-muted/50 transition-all group" title={isAdmin ? "Log Aktivitas" : "Profil"}>
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-xs shadow-sm">
            {session?.user?.name ? session.user.name.substring(0, 1).toUpperCase() : "G"}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-semibold text-foreground leading-tight">
              {session?.user?.name || "Tamu"}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              {isAdmin ? "Administrator" : "Pengamat"}
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
