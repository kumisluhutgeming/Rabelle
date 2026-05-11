"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Settings as SettingsIcon, 
  Map as MapIcon, 
  Shield, 
  Key, 
  Bell, 
  Globe, 
  Smartphone, 
  Lock, 
  Database,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Zap,
  Plus
} from "lucide-react";

const TABS = [
  { id: "general", label: "Umum", icon: User },
  { id: "preferences", label: "Preferensi Peta", icon: MapIcon },
  { id: "api", label: "Developer & API", icon: Key },
  { id: "security", label: "Keamanan", icon: Shield },
];

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("general");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && TABS.find(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-foreground tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground font-medium">Kelola profil, preferensi, dan keamanan akun Anda.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <aside className="lg:w-64 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm
                ${activeTab === tab.id 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }
              `}
            >
              <tab.icon size={18} />
              {tab.label}
              {activeTab === tab.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-card border border-border shadow-xl rounded-[32px] overflow-hidden"
            >
              <div className="p-8 space-y-8">
                {activeTab === "general" && <GeneralSettings onSave={handleSave} />}
                {activeTab === "preferences" && <MapPreferences onSave={handleSave} />}
                {activeTab === "api" && <ApiSettings onSave={handleSave} />}
                {activeTab === "security" && <SecuritySettings onSave={handleSave} />}
              </div>

              {/* Action Bar */}
              <div className="px-8 py-5 bg-secondary/20 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AnimatePresence>
                    {isSaved && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2 text-emerald-500 font-bold text-xs"
                      >
                        <CheckCircle2 size={14} />
                        Perubahan disimpan
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button 
                  onClick={handleSave}
                  className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  Simpan Perubahan
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function GeneralSettings({ onSave }: { onSave: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 rounded-3xl bg-secondary flex items-center justify-center text-primary font-black text-3xl shadow-inner relative group cursor-pointer">
          H
          <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
            Ganti
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Foto Profil</h3>
          <p className="text-xs text-muted-foreground mt-1">Disarankan menggunakan file JPG atau PNG minimal 400x400px.</p>
          <div className="flex gap-2 mt-4">
            <button className="px-4 py-2 bg-secondary hover:bg-muted rounded-xl text-xs font-bold transition-all">Upload Baru</button>
            <button className="px-4 py-2 text-destructive hover:bg-destructive/10 rounded-xl text-xs font-bold transition-all">Hapus</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="space-y-1.5">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Nama Lengkap</label>
          <input type="text" className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-primary/10 outline-none transition-all" defaultValue="Harits" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Alamat Email</label>
          <input type="email" className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-primary/10 outline-none transition-all" defaultValue="harits@example.com" />
        </div>
      </div>
    </div>
  );
}

function MapPreferences({ onSave }: { onSave: () => void }) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Globe size={18} className="text-primary" />
          Tampilan Peta
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {["Vibrant", "Positron", "Dark"].map(style => (
            <div key={style} className="border-2 border-primary bg-secondary/30 rounded-2xl p-4 cursor-pointer hover:border-primary/50 transition-all text-center">
              <div className="w-full aspect-video bg-zinc-300 rounded-lg mb-3 shadow-inner" />
              <span className="text-xs font-bold">{style}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Zap size={18} className="text-amber-500" />
          Unit & Pengukuran
        </h3>
        <div className="flex flex-wrap gap-10">
          <div className="space-y-3">
             <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Format Koordinat</label>
             <div className="flex gap-2">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold">Decimal</button>
                <button className="px-4 py-2 bg-secondary text-muted-foreground rounded-xl text-xs font-bold hover:bg-muted transition-all">DMS</button>
             </div>
          </div>
          <div className="space-y-3">
             <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Unit Sinyal</label>
             <div className="flex gap-2">
                <button className="px-4 py-2 bg-secondary text-muted-foreground rounded-xl text-xs font-bold hover:bg-muted transition-all">Persentase (%)</button>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold">dBm</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiSettings({ onSave }: { onSave: () => void }) {
  return (
    <div className="space-y-8">
      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-4">
        <Zap size={20} className="text-amber-500 mt-1 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-amber-700">Akses Developer API</h4>
          <p className="text-xs text-amber-600/80 mt-1 leading-relaxed">Gunakan API keys untuk mengakses data geospasial Rabelle dari aplikasi pihak ketiga Anda secara terprogram.</p>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Active API Keys</h3>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-bold transition-all">
            <Plus size={14} />
            Generate New Key
          </button>
        </div>
        
        <div className="border border-border rounded-2xl divide-y divide-border">
          {[
            { name: "Development Key", key: "rb_live_••••••••••••••••3a9c", date: "Created 12 Mar 2026" },
            { name: "Production Dashboard", key: "rb_live_••••••••••••••••7f2b", date: "Created 05 Jan 2026" }
          ].map(item => (
            <div key={item.key} className="p-4 flex items-center justify-between group">
              <div className="space-y-1">
                <div className="text-sm font-bold">{item.name}</div>
                <code className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground">{item.key}</code>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 hover:bg-secondary rounded-lg text-muted-foreground transition-all"><SettingsIcon size={14} /></button>
                <button className="p-2 hover:bg-destructive/10 rounded-lg text-destructive transition-all"><Lock size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SecuritySettings({ onSave }: { onSave: () => void }) {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Lock size={18} className="text-rose-500" />
          Ubah Password
        </h3>
        <div className="space-y-4 max-w-md">
           <div className="space-y-1.5">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Password Lama</label>
              <input type="password" placeholder="••••••••" className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
           </div>
           <div className="space-y-1.5">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Password Baru</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} placeholder="••••••••" className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-10 py-3 text-sm font-medium focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
           </div>
        </div>
      </div>

      <div className="space-y-6 pt-6 border-t border-border">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Smartphone size={18} className="text-primary" />
          Two-Factor Authentication
        </h3>
        <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-[24px]">
           <div className="space-y-1">
             <div className="text-sm font-bold text-foreground">Tambahkan Keamanan Ekstra</div>
             <p className="text-xs text-muted-foreground">Verifikasi login Anda melalui aplikasi authenticator atau SMS.</p>
           </div>
           <button className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20">Enable 2FA</button>
        </div>
      </div>
    </div>
  );
}
