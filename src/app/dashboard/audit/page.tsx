import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { History, ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AuditLogPage() {
  const session = await getServerSession(authOptions);

  if (!session || (!(session as any).user?.isAdmin && (session as any).user?.role !== "admin")) {
    redirect("/dashboard");
  }

  const logs = await prisma.audit_logs.findMany({
    orderBy: {
      created_at: "desc"
    },
    take: 100
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em]">
          <History size={14} />
          Log Keamanan
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Riwayat Audit Aktivitas</h1>
        <p className="text-muted-foreground font-medium">Pemantauan mutasi data dan aktivitas administratif secara real-time.</p>
      </div>

      <div className="surface-card p-6">
        <div className="overflow-x-auto rounded-xl border border-border bg-background/50">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-muted text-muted-foreground font-bold border-b border-border uppercase tracking-widest text-[10px]">
              <tr>
                <th className="px-5 py-4">ID</th>
                <th className="px-5 py-4">Aksi</th>
                <th className="px-5 py-4">Keterangan</th>
                <th className="px-5 py-4">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-20 text-center text-muted-foreground font-medium">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                        <ShieldAlert size={24} />
                      </div>
                      <p>Belum ada aktivitas tercatat di sistem.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id.toString()} className="hover:bg-accent/30 transition-colors group">
                    <td className="px-5 py-4 font-mono text-[10px] text-muted-foreground">
                      #{log.id.toString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider border border-primary/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-foreground font-medium leading-relaxed max-w-[500px]">
                      {log.details}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground text-[10px] font-medium whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
