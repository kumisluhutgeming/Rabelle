"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Map, BarChart3, Radio, Tv, LogOut, ChevronRight, Globe, Shield, Zap, Search, Layout, Database, CheckCircle2, ArrowRight } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LandingPageClient({ session, stats }: { session: any, stats: any }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  return (
    <div className="bg-background text-foreground antialiased min-h-screen flex flex-col selection:bg-primary/20 transition-colors duration-500">
      {/* Navigation */}
      <nav className="fixed w-full z-[100] bg-background/70 backdrop-blur-md border-b border-border transition-all">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                {mounted && theme === "dark" ? (
                  <img src="/tacet-white.png" alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                )}
              </div>
              <span className="font-bold text-xl tracking-tight text-foreground">Rabelle</span>
            </Link>
            
            <div className="flex items-center gap-8">
              <div className="hidden md:flex items-center gap-8">
                <Link href="#fitur" className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-[0.2em]">Fitur</Link>
                <Link href="#cara-kerja" className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-[0.2em]">Cara Kerja</Link>
                <Link href="/dashboard" className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-[0.2em]">Dashboard</Link>
              </div>
              
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <div className="w-px h-4 bg-border" />
                {session ? (
                  <button 
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-bold text-[10px] hover:bg-muted transition-all uppercase tracking-widest"
                  >
                    Keluar
                  </button>
                ) : (
                  <Link href="/login" className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-[10px] hover:opacity-90 transition-all shadow-lg shadow-primary/20 uppercase tracking-widest">
                    Mulai Sekarang
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 lg:pt-56 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10 text-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto space-y-10"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-primary text-[10px] font-bold uppercase tracking-[0.2em]">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Platform Geographic Intelligence Terpadu
            </motion.div>

            <motion.h1 variants={fadeIn} className="text-5xl lg:text-8xl font-black tracking-tight leading-[0.95] text-foreground">
              Petakan Infrastruktur <br />
              Digital Nasional <span className="text-primary/80">Secara Presisi.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
              Satu platform terpusat untuk memetakan, menganalisis, dan mengoptimalkan aset telekomunikasi di seluruh wilayah Indonesia. Dibangun untuk efisiensi profesional.
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/dashboard/maps" className="group w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-[11px] uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
                Eksplorasi Peta <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-card border border-border text-foreground font-bold text-[11px] uppercase tracking-widest hover:bg-muted transition-all flex items-center justify-center gap-2">
                Lihat Dashboard
              </Link>
            </motion.div>
          </motion.div>

          {/* Product Visual Actual Screenshot */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-24 relative mx-auto max-w-6xl"
          >
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl bg-card">
              <img src="/hero-actual.png" alt="Rabelle Actual Dashboard" className="w-full h-auto" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
            </div>
            
            {/* Floating Stats Decors */}
            <div className="absolute -top-10 -right-10 hidden xl:block">
              <div className="surface-card p-6 shadow-2xl border border-border animate-bounce-slow">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Akurasi Koordinat</p>
                <p className="text-3xl font-black text-emerald-500">99.9%</p>
              </div>
            </div>
            <div className="absolute top-1/2 -left-20 hidden xl:block">
              <div className="surface-card p-6 shadow-2xl border border-border animate-bounce-slow" style={{ animationDelay: '1s' }}>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Total Menara</p>
                <p className="text-3xl font-black text-primary">{stats.total.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem -> Solution Section */}
      <section className="py-24 lg:py-40 bg-card/30" id="fitur">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-12">
              <div className="space-y-4">
                <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Tantangan Industri</h2>
                <h3 className="text-4xl lg:text-5xl font-black tracking-tight leading-[1.1]">Mengapa Sulit Mengelola <br /> Infrastruktur Jaringan?</h3>
              </div>
              
              <div className="space-y-10">
                {[
                  { prob: "Data Terfragmentasi", sol: "Kami menyatukan ribuan titik data dari berbagai operator ke dalam satu repositori terpusat yang selalu mutakhir." },
                  { prob: "Koordinat Tidak Akurat", sol: "Sistem validasi otomatis kami memastikan setiap menara terpetakan dengan presisi tinggi hingga level desa." },
                  { prob: "Visualisasi Yang Rumit", sol: "Kami menghadirkan antarmuka peta interaktif yang ringan, memudahkan Anda melihat cakupan tanpa hambatan teknis." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary group-hover:scale-110 transition-all">
                      <Zap size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-2 text-foreground">{item.prob}</h4>
                      <p className="text-muted-foreground leading-relaxed text-sm font-medium">{item.sol}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4 pt-12">
                <div className="surface-card p-8 space-y-4 border-border/50">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><Radio size={20} /></div>
                  <h4 className="font-black text-sm uppercase tracking-widest">Seluler</h4>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">Pantau sebaran BTS operator seluler di seluruh wilayah Indonesia secara real-time.</p>
                </div>
                <div className="surface-card p-8 space-y-4 border-border/50">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center"><Tv size={20} /></div>
                  <h4 className="font-black text-sm uppercase tracking-widest">Televisi</h4>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">Visualisasi jangkauan stasiun TV untuk memastikan pemerataan informasi di pelosok.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="surface-card p-8 space-y-4 border-border/50">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><BarChart3 size={20} /></div>
                  <h4 className="font-black text-sm uppercase tracking-widest">Analitik</h4>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">Analisis pertumbuhan infrastruktur per provinsi dengan data yang mudah dibaca.</p>
                </div>
                <div className="surface-card p-8 space-y-4 border-border/50">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><Shield size={20} /></div>
                  <h4 className="font-black text-sm uppercase tracking-widest">Keamanan</h4>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">Audit log dan manajemen hak akses untuk menjaga integritas data infrastruktur.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 lg:py-40" id="cara-kerja">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-24 space-y-4">
            <h2 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Alur Kerja</h2>
            <h3 className="text-4xl lg:text-5xl font-black tracking-tight">Dari Data Menjadi Keputusan.</h3>
            <p className="text-muted-foreground font-medium">Tiga langkah sederhana untuk menguasai informasi infrastruktur digital.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="absolute top-1/2 left-0 w-full h-px bg-border hidden md:block z-0" />
            
            {[
              { step: "01", label: "Akses Dashboard", desc: "Masuk ke panel kendali utama untuk melihat gambaran umum sebaran infrastruktur secara nasional.", icon: Layout },
              { step: "02", label: "Filter Wilayah", desc: "Pilih provinsi, kota, atau operator spesifik untuk mempersempit fokus analisis Anda.", icon: Search },
              { step: "03", label: "Analisis & Ekspor", desc: "Dapatkan detail koordinat, status menara, dan unduh laporan dalam format yang Anda butuhkan.", icon: Database }
            ].map((item, i) => (
              <div key={i} className="relative z-10 space-y-8 text-center bg-background px-4">
                <div className="w-20 h-20 rounded-full bg-card border border-border shadow-xl flex items-center justify-center mx-auto group hover:border-primary transition-colors">
                  <item.icon size={32} className="text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] font-black text-primary uppercase tracking-widest">{item.step}</div>
                  <h4 className="font-bold text-xl">{item.label}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed font-medium px-4">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Highlight (Social Proof) */}
      <section className="py-24 bg-primary text-primary-foreground overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center space-y-12">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Kepercayaan Dalam Angka</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-2">
              <p className="text-5xl lg:text-7xl font-black tracking-tighter">{stats.total.toLocaleString()}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Titik Infrastruktur</p>
            </div>
            <div className="space-y-2">
              <p className="text-5xl lg:text-7xl font-black tracking-tighter">7</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Provinsi Tercover</p>
            </div>
            <div className="space-y-2">
              <p className="text-5xl lg:text-7xl font-black tracking-tighter">100%</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Data Terverifikasi</p>
            </div>
            <div className="space-y-2">
              <p className="text-5xl lg:text-7xl font-black tracking-tighter">24/7</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Uptime Layanan</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 lg:py-56 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10 text-center space-y-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-5xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.1]">
              Siap Menguasai <br /> <span className="text-primary">Data Infrastruktur?</span>
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
              Bergabunglah dengan para profesional yang telah mengandalkan Rabelle untuk efisiensi pemetaan aset digital Indonesia.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard/maps" className="w-full sm:w-auto px-10 py-5 rounded-xl bg-primary text-primary-foreground font-bold text-[11px] uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-2xl shadow-primary/30">
                Mulai Eksplorasi Sekarang
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Akses Gratis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Data Akurat</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-border bg-card/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7">
                {mounted && theme === "dark" ? (
                  <img src="/tacet-white.png" alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain grayscale opacity-50" />
                )}
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">© 2026 Rabelle Geographic Intelligence.</p>
            </div>
            <div className="flex gap-10">
              <Link href="/privacy" className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors">Privasi</Link>
              <Link href="/terms" className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors">Ketentuan</Link>
              <Link href="mailto:contact@rabelle.id" className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors">Kontak</Link>
            </div>
          </div>
        </div>
      </footer>
      
      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
