"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Map as MapIcon, 
  LayoutDashboard, 
  Table, 
  History, 
  Settings, 
  ShieldCheck,
  Command,
  ArrowRight,
  Clock,
  Zap,
  Globe,
  Navigation
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  href?: string;
  icon: any;
  category: "Navigasi" | "Aksi" | "Peta";
  shortcut?: string;
  description?: string;
  action?: () => void;
}

const COMMANDS: CommandItem[] = [
  { id: "dash", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, category: "Navigasi", shortcut: "G D" },
  { id: "maps", label: "Peta Interaktif", href: "/dashboard/maps", icon: MapIcon, category: "Navigasi", shortcut: "G M" },
  { id: "data", label: "Tabel Data", href: "/dashboard/data-tabel", icon: Table, category: "Navigasi", shortcut: "G T" },
  { id: "audit", label: "Riwayat Audit", href: "/dashboard/audit", icon: History, category: "Navigasi", shortcut: "G A" },
  { id: "settings", label: "Pengaturan Sistem", href: "/dashboard/settings", icon: Settings, category: "Navigasi", shortcut: "G S" },
  { id: "signals", label: "Ukur Sinyal GPS", action: () => window.dispatchEvent(new Event('checkSignal')), icon: Navigation, category: "Aksi", description: "Mencari lokasi saya di peta" },
  { id: "theme", label: "Ganti Tema", action: () => console.log("Toggle theme"), icon: Zap, category: "Aksi", description: "Beralih antara mode gelap & terang" },
  { id: "bdg", label: "Fokus ke Bandung", href: "/dashboard/maps?kota=Kota Bandung", icon: Globe, category: "Peta" },
  { id: "jkt", label: "Fokus ke Jakarta", href: "/dashboard/maps?kota=Jakarta Pusat", icon: Globe, category: "Peta" },
  { id: "bli", label: "Fokus ke Bali", href: "/dashboard/maps?provinsi=Bali", icon: Globe, category: "Peta" },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = COMMANDS.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase()) || 
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setQuery("");
    setSelectedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 10);
  }, []);

  const handleClose = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const executeCommand = (cmd: CommandItem) => {
    if (cmd.href) router.push(cmd.href);
    if (cmd.action) cmd.action();
    handleClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === "Enter") {
      if (filteredCommands[selectedIndex]) {
        executeCommand(filteredCommands[selectedIndex]);
      }
    }
  };

  return (
    <>
      {/* Search Bar Trigger */}
      <button 
        onClick={handleOpen}
        className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground transition-all group w-48 lg:w-64"
      >
        <Search size={14} className="group-hover:text-foreground transition-colors" />
        <span className="text-xs font-medium flex-grow text-left">Cari (⌘K)</span>
        <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[2000] flex items-start justify-center pt-[15vh] p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[6px]"
            />

            {/* Modal Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative w-full max-w-[600px] bg-card border border-border shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 border-b border-border h-14">
                <Search size={18} className="text-muted-foreground" />
                <input 
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                  onKeyDown={onKeyDown}
                  placeholder="Ketik perintah atau cari sesuatu..."
                  className="flex-1 bg-transparent border-none outline-none text-foreground text-sm font-medium placeholder:text-muted-foreground"
                />
                <div className="flex items-center gap-1 px-2 py-1 bg-secondary rounded text-[10px] font-bold text-muted-foreground">
                  ESC
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto py-2 custom-scrollbar">
                {filteredCommands.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                      <Search size={20} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm font-bold text-foreground">Tidak ada hasil ditemukan</p>
                    <p className="text-xs text-muted-foreground mt-1">Coba gunakan kata kunci lain.</p>
                  </div>
                ) : (
                  Object.entries(
                    filteredCommands.reduce((acc, cmd) => {
                      if (!acc[cmd.category]) acc[cmd.category] = [];
                      acc[cmd.category].push(cmd);
                      return acc;
                    }, {} as Record<string, CommandItem[]>)
                  ).map(([category, items], catIdx) => (
                    <div key={category}>
                      <div className="px-4 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-secondary/30">
                        {category}
                      </div>
                      <div className="p-1">
                        {items.map((item) => {
                          const isSelected = filteredCommands[selectedIndex]?.id === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => executeCommand(item)}
                              onMouseEnter={() => setSelectedIndex(filteredCommands.indexOf(item))}
                              className={`
                                w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all text-left group
                                ${isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-secondary text-foreground"}
                              `}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? "bg-white/20" : "bg-secondary group-hover:bg-background"}`}>
                                  <item.icon size={16} />
                                </div>
                                <div>
                                  <div className="text-sm font-bold">{item.label}</div>
                                  {item.description && (
                                    <div className={`text-[10px] font-medium opacity-70`}>{item.description}</div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {item.shortcut && !isSelected && (
                                  <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                    {item.shortcut}
                                  </div>
                                )}
                                {isSelected && <ArrowRight size={14} className="animate-in slide-in-from-left-2 duration-200" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="h-10 px-4 border-t border-border bg-secondary/20 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><Command size={10} /> Navigate</span>
                  <span className="flex items-center gap-1.5"><Zap size={10} /> Execute</span>
                </div>
                <div>Rabelle Intelligence v2</div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
