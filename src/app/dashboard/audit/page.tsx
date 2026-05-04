import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

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
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#1d1d1f] tracking-tight">Log Aktivitas Audit</h1>
          <p className="text-gray-500 mt-1">Daftar lengkap riwayat aktivitas dan mutasi data yang dilakukan oleh Admin</p>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white/70 backdrop-blur-[20px] border border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[24px] p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3 rounded-tl-xl">ID</th>
                  <th className="px-5 py-3">Aksi</th>
                  <th className="px-5 py-3">Keterangan</th>
                  <th className="px-5 py-3 rounded-tr-xl">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                      belum ada aktivitas disini, ayo audit sesuatu
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id.toString()} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-400">
                        #{log.id.toString()}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        <span className="bg-sky-50 text-sky-600 px-2.5 py-1 rounded-lg text-xs">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-[400px]">
                        {log.details}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">
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
    </div>
  );
}
