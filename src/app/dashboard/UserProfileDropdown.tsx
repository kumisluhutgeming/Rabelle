"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Settings, 
  LogOut, 
  HelpCircle, 
  Book, 
  Zap, 
  ChevronDown,
  Shield,
  CreditCard
} from "lucide-react";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function UserProfileDropdown({ session }: { session: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const isAdmin = session?.user?.isAdmin || session?.user?.role === "admin";

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-3 pl-1 pr-3 py-1 rounded-full transition-all group border border-transparent 
          ${isOpen ? "bg-secondary border-border" : "bg-secondary/50 hover:bg-secondary hover:border-border"}
        `}
      >
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shadow-sm ring-2 ring-background">
          {session?.user?.name ? session.user.name.substring(0, 1).toUpperCase() : "G"}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-bold text-foreground leading-tight">
            {session?.user?.name || "Tamu"}
          </span>
          <span className="text-[10px] font-medium text-muted-foreground leading-tight opacity-70">
            {isAdmin ? "Administrator" : "Pengamat"}
          </span>
        </div>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-64 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden z-50 origin-top-right"
            >
              {/* Header */}
              <div className="p-4 bg-secondary/30 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {session?.user?.name ? session.user.name.substring(0, 1).toUpperCase() : "G"}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{session?.user?.name || "Tamu"}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[140px]">{session?.user?.email || "guest@rabelle.io"}</div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-1.5 space-y-0.5">
                <Link 
                  href="/dashboard/settings" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-all group"
                >
                  <User size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  Profil & Akun
                </Link>
                <Link 
                  href="/dashboard/settings?tab=preferences" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-all group"
                >
                  <Settings size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  Pengaturan
                </Link>
                <div className="h-px bg-border my-1.5 mx-2" />
                <Link 
                  href="/docs" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-all group"
                >
                  <Book size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  Dokumentasi API
                </Link>
                <button 
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Zap size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    Bantuan
                  </div>
                  <HelpCircle size={14} className="text-muted-foreground/50" />
                </button>
              </div>

              {/* Footer */}
              <div className="p-1.5 bg-secondary/20 border-t border-border">
                <div className="flex items-center justify-between px-3 py-1.5">
                   <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sistem</span>
                   <ThemeToggle />
                </div>
                <button 
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/10 transition-all"
                >
                  <LogOut size={16} />
                  Keluar dari Akun
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
