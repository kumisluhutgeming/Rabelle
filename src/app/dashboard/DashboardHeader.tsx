"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIdle } from "./IdleProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Search, Bell, ChevronRight, User, Settings, LogOut, Layout } from "lucide-react";
import { useState, useEffect } from "react";

export default function DashboardHeader({ session }: { session: any }) {
  const { isMapPage } = useIdle();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isMapPage) return null;
  if (!mounted) return null;

  const isAdmin = session?.user?.isAdmin || session?.user?.role === "admin";
  
  // Breadcrumbs logic
  const paths = pathname.split("/").filter(p => p && p !== "dashboard");
  const breadcrumbs = paths.map((p, i) => ({
    label: p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, " "),
    href: `/dashboard/${paths.slice(0, i + 1).join("/")}`,
    active: i === paths.length - 1
  }));

  return (
    <header className="bg-background/80 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-6 lg:px-8 z-40 sticky top-0 transition-all">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 overflow-hidden">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
          <Layout size={16} />
        </Link>
        {breadcrumbs.length > 0 && <ChevronRight size={14} className="text-muted-foreground/40 shrink-0" />}
        {breadcrumbs.map((crumb, i) => (
          <div key={i} className="flex items-center gap-2 overflow-hidden">
            <Link 
              href={crumb.href} 
              className={`text-sm font-medium whitespace-nowrap transition-colors ${crumb.active ? "text-foreground cursor-default" : "text-muted-foreground hover:text-foreground"}`}
            >
              {crumb.label}
            </Link>
            {i < breadcrumbs.length - 1 && <ChevronRight size={14} className="text-muted-foreground/40 shrink-0" />}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Global Search Hint */}
        <button className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground transition-all group w-48 lg:w-64">
          <Search size={14} className="group-hover:text-foreground transition-colors" />
          <span className="text-xs font-medium flex-grow text-left">Cari data...</span>
          <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        <div className="w-px h-4 bg-border hidden md:block" />

        <div className="flex items-center gap-1 lg:gap-2">
          <button className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all relative">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
          </button>
          
          <ThemeToggle />
        </div>

        <div className="w-px h-4 bg-border" />

        {/* User Profile */}
        <Link 
          href={isAdmin ? "/dashboard/audit" : "/profile"} 
          className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full bg-secondary/50 hover:bg-secondary transition-all group border border-transparent hover:border-border"
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shadow-sm ring-2 ring-background">
            {session?.user?.name ? session.user.name.substring(0, 1).toUpperCase() : "G"}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-bold text-foreground leading-tight">
              {session?.user?.name || "Tamu"}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground leading-tight opacity-70">
              {isAdmin ? "Administrator" : "Pengamat"}
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
