"use client";

import { useSession } from "next-auth/react";
import { 
  Radio, 
  Tv, 
  Smartphone, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronRight, 
  Plus, 
  FileText, 
  Download, 
  Map as MapIcon,
  BellRing,
  AlertCircle,
  Clock
} from "lucide-react";
import { ProvinceBarChart, OperatorDoughnutChart } from "./EnhancedCharts";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function DashboardPageClient({ stats }: { stats: any }) {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isAdmin = session?.user?.isAdmin || session?.user?.role === "admin";

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Ringkasan Dashboard</h1>
        <p className="text-muted-foreground font-medium">Selamat datang kembali, {session?.user?.name || "Pengguna"}. Berikut status infrastruktur hari ini.</p>
      </div>

      {/* KPI Row - Status Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Infrastruktur", value: stats.total, icon: Activity, delta: "+12", trend: "up", color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Menara Seluler", value: stats.bts, icon: Smartphone, delta: "+8", trend: "up", color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Stasiun TV", value: stats.tv, icon: Tv, delta: "0", trend: "neutral", color: "text-rose-500", bg: "bg-rose-500/10" },
          { label: "Stasiun Radio", value: stats.radio, icon: Radio, delta: "-2", trend: "down", color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((kpi, i) => (
          <div key={i} className="surface-card p-6 space-y-4 group hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-xl ${kpi.bg} ${kpi.color}`}>
                <kpi.icon size={20} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                kpi.trend === "up" ? "bg-emerald-500/10 text-emerald-500" : 
                kpi.trend === "down" ? "bg-rose-500/10 text-rose-500" : 
                "bg-muted text-muted-foreground"
              }`}>
                {kpi.trend === "up" ? <ArrowUpRight size={12} /> : kpi.trend === "down" ? <ArrowDownRight size={12} /> : null}
                {kpi.delta}%
              </div>
            </div>
            <div>
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{kpi.label}</h3>
              <p className="text-3xl font-black text-foreground tracking-tighter mt-1">{kpi.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart: Sebaran per Wilayah */}
        <div className="surface-card p-6 flex flex-col">
          <div className="mb-8">
            <h3 className="text-lg font-bold">Sebaran per Wilayah</h3>
            <p className="text-xs text-muted-foreground font-medium">Data 10 provinsi dengan infrastruktur terbanyak.</p>
          </div>
          <div className="h-[350px] w-full">
            <ProvinceBarChart 
              data={stats.provinsi.map((p: any) => Number(p.count))} 
              labels={stats.provinsi.map((p: any) => p.name)} 
            />
          </div>
        </div>

        {/* Chart: Pangsa Pasar Operator */}
        <div className="surface-card p-6 flex flex-col">
          <div className="mb-8">
            <h3 className="text-lg font-bold">Pangsa Pasar Operator</h3>
            <p className="text-xs text-muted-foreground font-medium">Distribusi infrastruktur berdasarkan penyelenggara utama.</p>
          </div>
          <div className="flex-grow flex items-center justify-center h-[350px]">
            <OperatorDoughnutChart 
              data={stats.operators.map((o: any) => o.count)} 
              labels={stats.operators.map((o: any) => o.name)} 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin Section - Left 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {isAdmin && (
            <div className="surface-card p-6 space-y-6">
              <h3 className="text-sm font-bold">Tindakan Cepat</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Tambah Menara", icon: Plus, href: "/dashboard/edit-data/new", color: "bg-primary text-primary-foreground" },
                  { label: "Unduh CSV", icon: Download, href: "/dashboard/data-tabel", color: "bg-secondary text-secondary-foreground" },
                  { label: "Buka Peta", icon: MapIcon, href: "/dashboard/maps", color: "bg-secondary text-secondary-foreground" },
                  { label: "Riwayat Audit", icon: FileText, href: "/dashboard/audit", color: "bg-secondary text-secondary-foreground" },
                ].map((act, i) => (
                  <Link key={i} href={act.href} className={`flex items-center gap-3 p-4 rounded-xl transition-all hover:translate-x-1 font-bold text-xs uppercase tracking-widest ${act.color}`}>
                    <act.icon size={18} />
                    {act.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel - Right 1/3 */}
        <div className="space-y-6">
          {/* Alerts / Attention Required - Only Admin */}
          {isAdmin && (
            <div className="surface-card p-6 border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center gap-2 text-amber-600 mb-6">
                <BellRing size={18} />
                <h3 className="text-sm font-bold uppercase tracking-widest">Perhatian</h3>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4 p-4 rounded-xl bg-background/50 border border-amber-500/10">
                  <AlertCircle size={20} className="text-amber-500 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold">3 Menara memerlukan verifikasi</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">Koordinat tidak sinkron dengan wilayah administratif.</p>
                  </div>
                </div>
                <Link href="/dashboard/audit" className="block text-center p-2 rounded-xl bg-amber-500 text-white font-bold text-[10px] uppercase tracking-widest hover:opacity-90">
                  Selesaikan Sekarang
                </Link>
              </div>
            </div>
          )}

          {/* Recent Activity - Only Admin */}
          {isAdmin && (
            <div className="surface-card p-6">
              <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
                <Clock size={16} className="text-muted-foreground" />
                Aktivitas Terbaru
              </h3>
              <div className="space-y-6">
                {[
                  { user: "Admin", action: "Menambahkan menara baru", target: "Kab. Sleman", time: "2 jam yang lalu" },
                  { user: "Sistem", action: "Update database otomatis", target: "Operator XL", time: "5 jam yang lalu" },
                  { user: "Harits", action: "Mengubah koordinat", target: "Menara Telkomsel", time: "1 hari yang lalu" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">
                      {item.user.substring(0, 1)}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium">
                        <span className="font-bold text-foreground">{item.user}</span> {item.action}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{item.target} • {item.time}</p>
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/audit" className="block text-center text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest pt-4">
                  Lihat Semua Aktivitas
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
