"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIdle } from "./IdleProvider";
import LogoutButton from "./LogoutButton";
import { useTheme } from "@/components/ThemeProvider";
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Table, 
  Settings, 
  Home, 
  ChevronLeft, 
  ChevronRight, 
  BarChart2, 
  ClipboardList, 
  Search, 
  History, 
  PlusCircle, 
  Bell, 
  ShieldCheck,
  Menu,
  X
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Utama",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Peta Interaktif", href: "/dashboard/maps", icon: MapIcon },
      { label: "Tabel Data", href: "/dashboard/data-tabel", icon: Table },
    ]
  },
  {
    label: "Sistem",
    items: [
      { label: "Riwayat Audit", href: "/dashboard/audit", icon: History, adminOnly: true },
      { label: "Pengaturan", href: "/dashboard/settings", icon: Settings },
      { label: "Hak Akses", href: "/dashboard/permissions", icon: ShieldCheck, adminOnly: true },
    ]
  }
];

export default function Sidebar({ session }: { session: any }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pathname = usePathname();
  const { isUiVisible, isMapPage, isSidebarCollapsed, setIsSidebarCollapsed } = useIdle();
  
  const isAdmin = session?.user?.isAdmin || session?.user?.role === "admin";

  const opacityClass = isMapPage && !isUiVisible ? "opacity-0 pointer-events-none" : "opacity-100";
  const widthClass = isSidebarCollapsed ? "w-16" : "w-64";
  const positionClass = isMapPage ? "fixed left-0 top-0 bottom-0" : "sticky top-0";

  if (!mounted) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Toggle Button */}
      {!isMobileMenuOpen && (
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg z-[70] flex items-center justify-center lg:hidden"
        >
          <Menu size={20} />
        </button>
      )}

      <aside 
        className={`
          bg-card border-r border-border flex flex-col z-50 transition-all duration-300 ease-in-out 
          ${widthClass} ${opacityClass} !rounded-r-3xl shadow-sm
          ${isMobileMenuOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"}
          ${isMapPage ? "fixed left-0 top-0 bottom-0" : "sticky top-0"} h-screen
        `}
      >
        <div className={`flex items-center justify-between ${isSidebarCollapsed ? "p-3" : "p-6"}`}>
          <Link href="/" className="flex items-center gap-3 overflow-hidden whitespace-nowrap group">
            <div className="w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              {theme === "dark" ? (
                <img src="/tacet-white.png" alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
              )}
            </div>
            {!isSidebarCollapsed && (
              <span className="font-bold text-lg tracking-tight text-foreground">Rabelle</span>
            )}
          </Link>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground transition-all"
              title={isSidebarCollapsed ? "Expand" : "Collapse"}
            >
              {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            <button 
              className="lg:hidden text-muted-foreground p-1"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-grow py-4 px-3 overflow-y-auto space-y-6">
          {NAV_GROUPS.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {!isSidebarCollapsed && (
                <h3 className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 opacity-50">
                  {group.label}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item, itemIdx) => {
                  if (item.adminOnly && !isAdmin) return null;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={itemIdx}
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-xl transition-all group relative
                        ${isActive 
                          ? "bg-secondary text-primary font-bold shadow-sm" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }
                      `}
                      title={isSidebarCollapsed ? item.label : ""}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon size={18} className={`${isActive ? "text-primary" : "group-hover:text-foreground"} transition-colors`} />
                      {!isSidebarCollapsed && (
                        <span className="text-sm tracking-tight">{item.label}</span>
                      )}
                      {isActive && !isSidebarCollapsed && (
                        <div className="absolute left-0 w-1 h-4 bg-primary rounded-r-full" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {session && (
          <div className={`p-4 border-t border-border`}>
            <LogoutButton isCollapsed={isSidebarCollapsed} />
          </div>
        )}
      </aside>
    </>
  );
}
