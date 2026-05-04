"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Map, Table as TableIcon, BarChart3, Radio, Tv, Wifi } from "lucide-react";

export default function LandingPageClient({ session, stats }: { session: any, stats: any }) {
  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  return (
    <div className="text-slate-800 antialiased relative overflow-x-hidden min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Background Elements */}
      <div 
        className="fixed inset-0 z-[-2]" 
        style={{
          backgroundSize: '40px 40px',
          backgroundImage: 'linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px)'
        }}
      ></div>
      <div className="absolute blur-[100px] opacity-40 bg-sky-300 w-[600px] h-[600px] rounded-full top-[-100px] left-[-100px] z-[-1] animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute blur-[120px] opacity-30 bg-indigo-300 w-[600px] h-[600px] rounded-full bottom-20 right-[-100px] z-[-1] animate-pulse" style={{ animationDuration: '12s' }}></div>

      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-xl border-b border-white/50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>
                </svg>
              </div>
              <span className="font-bold text-2xl tracking-tight text-slate-800">Rabel<span className="text-sky-600">le</span></span>
            </div>
            
            {/* Navigation Links */}
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors duration-200">
                Dashboard
              </Link>
              {session ? (
                <Link href="/dashboard" className="px-5 py-2.5 rounded-full bg-slate-800 text-white font-medium text-sm hover:bg-slate-700 transition-all shadow-sm">
                  Masuk Dashboard
                </Link>
              ) : (
                <Link href="/login" className="px-5 py-2.5 rounded-full border border-sky-200 bg-white text-sky-700 font-medium text-sm hover:bg-sky-50 transition-all duration-300 shadow-sm">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center pt-32 pb-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center max-w-4xl mx-auto space-y-8"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-sky-100 text-sky-600 text-sm font-medium mb-4 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
              Pusat Data Infrastruktur Terintegrasi
            </motion.div>

            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Eksplorasi Jaringan <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#007AFF] to-[#5856D6]">Tanpa Batas</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Platform publik Rabelle menyediakan pemetaan visual interaktif, analitik dashboard, dan basis data terlengkap untuk seluruh menara komunikasi di wilayah Anda.
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/dashboard/maps" className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#007AFF] hover:bg-[#0066CC] text-white font-semibold hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-[#007AFF]/30 flex items-center justify-center gap-2">
                <Map size={20} /> Lihat Peta Sekarang
              </Link>
              <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 hover:-translate-y-1 transition-all duration-300 shadow-sm flex items-center justify-center gap-2">
                <BarChart3 size={20} /> Lihat Analitik
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats Highlight Section */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="mt-32 mb-16"
          >
            <motion.div variants={fadeIn} className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-800">Skala Infrastruktur Terpantau</h2>
              <p className="text-slate-500 mt-2">Ribuan data menara tercatat secara real-time dan terverifikasi.</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <motion.div variants={fadeIn} className="bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-[24px] shadow-sm text-center transform hover:scale-105 transition-transform duration-300">
                <div className="w-12 h-12 mx-auto bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <Wifi size={24} />
                </div>
                <h3 className="text-4xl font-extrabold text-slate-900 mb-1">{stats.total}</h3>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Menara</p>
              </motion.div>
              <motion.div variants={fadeIn} className="bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-[24px] shadow-sm text-center transform hover:scale-105 transition-transform duration-300">
                <div className="w-12 h-12 mx-auto bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path></svg>
                </div>
                <h3 className="text-4xl font-extrabold text-slate-900 mb-1">{stats.bts}</h3>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Base Station (BTS)</p>
              </motion.div>
              <motion.div variants={fadeIn} className="bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-[24px] shadow-sm text-center transform hover:scale-105 transition-transform duration-300">
                <div className="w-12 h-12 mx-auto bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <Tv size={24} />
                </div>
                <h3 className="text-4xl font-extrabold text-slate-900 mb-1">{stats.tv}</h3>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Stasiun Televisi</p>
              </motion.div>
              <motion.div variants={fadeIn} className="bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-[24px] shadow-sm text-center transform hover:scale-105 transition-transform duration-300">
                <div className="w-12 h-12 mx-auto bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-4">
                  <Radio size={24} />
                </div>
                <h3 className="text-4xl font-extrabold text-slate-900 mb-1">{stats.radio}</h3>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Stasiun Radio</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Features Detail Section */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="mt-24 pt-24 border-t border-slate-200/60"
          >
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-800">Kenapa Memilih Rabelle?</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div variants={fadeIn} className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-sm p-8 rounded-[24px] hover:shadow-md transition-all duration-300 group">
                <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center mb-6 group-hover:bg-indigo-500 transition-colors duration-300">
                  <Map size={28} className="text-indigo-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Peta Interaktif Layar Penuh</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  Navigasi peta sebaran menara dengan filter mengambang (floating) bergaya modern. Sangat halus, responsif, dan memberikan tampilan tanpa halangan.
                </p>
              </motion.div>

              <motion.div variants={fadeIn} className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-sm p-8 rounded-[24px] hover:shadow-md transition-all duration-300 group">
                <div className="w-14 h-14 rounded-xl bg-sky-50 flex items-center justify-center mb-6 group-hover:bg-sky-500 transition-colors duration-300">
                  <TableIcon size={28} className="text-sky-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Database Akurat & Ekspor</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  Cari dan saring ribuan data stasiun dari tabel berkinerja tinggi. Pengguna terdaftar juga dapat mengunduh himpunan data langsung ke dalam format spreadsheet.
                </p>
              </motion.div>

              <motion.div variants={fadeIn} className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-sm p-8 rounded-[24px] hover:shadow-md transition-all duration-300 group">
                <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-colors duration-300">
                  <BarChart3 size={28} className="text-emerald-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Analitik Real-Time</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  Pantau komposisi menara komunikasi berdasarkan kategori operator melalui grafik statistik yang diperbarui seketika oleh sistem.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>
      
      <footer className="py-8 text-center border-t border-slate-200/60 mt-12">
        <p className="text-slate-500 text-sm">© 2026 Rabelle Platform Infrastruktur. Membangun konektivitas masa depan.</p>
      </footer>
    </div>
  );
}
