"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  X, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  History,
  Zap,
  MoreVertical,
  Filter
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "system";
  time: string;
  read: boolean;
}

const INITIAL_NOTIFS: Notification[] = [
  {
    id: "1",
    title: "Intelijen Wilayah",
    message: "Kepadatan sinyal di Jawa Barat meningkat 15% hari ini.",
    type: "warning",
    time: "2 menit yang lalu",
    read: false
  },
  {
    id: "2",
    title: "Database Diperbarui",
    message: "Data infrastruktur wilayah Bali berhasil disinkronisasi.",
    type: "success",
    time: "1 jam yang lalu",
    read: false
  },
  {
    id: "3",
    title: "Aksi Administratif",
    message: "5 aksi administratif baru perlu ditinjau di log audit.",
    type: "system",
    time: "3 jam yang lalu",
    read: true
  },
  {
    id: "4",
    title: "Optimasi Jaringan",
    message: "Algoritma clustering peta diperbarui untuk kecepatan akses.",
    type: "info",
    time: "1 hari yang lalu",
    read: true
  }
];

import { useSession } from "next-auth/react";

export default function NotificationsPanel() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const isAdmin = session?.user?.isAdmin || session?.user?.role === "admin";
  
  const [notifications, setNotifications] = useState(INITIAL_NOTIFS);
  
  // Filter notifications for guest/viewer users
  const visibleNotifications = notifications.filter(n => {
    if (isAdmin) return true;
    // Hide administrative or system alerts from non-admins
    return n.type !== "system" && !n.title.toLowerCase().includes("administratif") && !n.title.toLowerCase().includes("audit");
  });

  const unreadCount = visibleNotifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all relative group"
      >
        <Bell size={20} className="group-hover:rotate-[15deg] transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background animate-in fade-in zoom-in duration-300" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[1000]" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-[380px] bg-card border border-border shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-2xl overflow-hidden z-[1001] origin-top-right flex flex-col max-h-[600px]"
            >
              {/* Header */}
              <div className="p-5 border-b border-border bg-secondary/20 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">Pusat Aktivitas</h3>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">Umpan Notifikasi</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={markAllRead} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-all" title="Tandai semua dibaca">
                    <CheckCircle2 size={16} />
                  </button>
                  <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-all">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Feed */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-card/50">
                {visibleNotifications.length === 0 ? (
                  <div className="py-20 text-center">
                    <Zap size={32} className="text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-sm font-bold text-foreground">Semua bersih!</p>
                    <p className="text-xs text-muted-foreground mt-1">Anda tidak memiliki notifikasi baru.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {visibleNotifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-4 transition-colors relative group ${n.read ? "bg-transparent" : "bg-primary/5"}`}
                      >
                        {!n.read && (
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                        )}
                        <div className="flex gap-4">
                          <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                            ${n.type === "warning" ? "bg-amber-500/10 text-amber-500" : 
                              n.type === "success" ? "bg-emerald-500/10 text-emerald-500" :
                              n.type === "system" ? "bg-indigo-500/10 text-indigo-500" :
                              "bg-sky-500/10 text-sky-500"}
                          `}>
                            {n.type === "warning" && <AlertTriangle size={18} />}
                            {n.type === "success" && <CheckCircle2 size={18} />}
                            {n.type === "system" && <History size={18} />}
                            {n.type === "info" && <Info size={18} />}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`text-xs font-black uppercase tracking-widest ${n.read ? "text-muted-foreground" : "text-primary"}`}>{n.title}</h4>
                              <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">{n.time}</span>
                            </div>
                            <p className="text-[13px] font-medium text-foreground leading-relaxed">{n.message}</p>
                            {!n.read && (
                              <button className="text-[11px] font-bold text-primary hover:underline pt-1">
                                Lihat Detail
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-border bg-secondary/10 flex justify-center">
                <button className="text-[11px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors flex items-center gap-2">
                  Lihat Semua Aktivitas
                  <ArrowRight size={12} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ArrowRight({ size, className }: { size: number, className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14m-7-7 7 7-7 7" />
    </svg>
  );
}
