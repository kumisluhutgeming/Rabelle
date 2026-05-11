"use client";

import CommandPalette from "./CommandPalette";
import NotificationsPanel from "./NotificationsPanel";
import UserProfileDropdown from "./UserProfileDropdown";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIdle } from "./IdleProvider";
import { useState, useEffect } from "react";
import { ChevronRight, Layout } from "lucide-react";

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
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
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
        {/* Modern Search Trigger */}
        <CommandPalette />

        <div className="w-px h-4 bg-border hidden md:block" />

        <div className="flex items-center gap-1 lg:gap-2">
          <NotificationsPanel />
        </div>

        <div className="w-px h-4 bg-border" />

        {/* User Profile Dropdown */}
        <UserProfileDropdown session={session} />
      </div>
    </header>
  );
}
