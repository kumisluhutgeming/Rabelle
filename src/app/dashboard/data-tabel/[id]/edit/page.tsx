import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import EditForm from "./EditForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditDataPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.isAdmin) {
    redirect("/dashboard/data-tabel");
  }

  const { id } = await params;

  const pengukuran = await prisma.pengukuran.findUnique({
    where: { id: BigInt(id) },
    include: {
      stasiun_radio: true,
      lokasi_pemancar: true,
      locations: true
    }
  });

  if (!pengukuran) {
    notFound();
  }

  // Pre-fill data
  const initialData = {
    id: pengukuran.id.toString(),
    operator: pengukuran.stasiun_radio?.nama_penyelenggara || "",
    jenis: pengukuran.stasiun_radio?.jenis_komunikasi || "BTS",
    provinsi: pengukuran.locations?.provinsi || "DKI Jakarta",
    kota: pengukuran.locations?.kota || "",
    lat: pengukuran.lokasi_pemancar?.latitude?.toString() || "",
    lng: pengukuran.lokasi_pemancar?.longitude?.toString() || ""
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/dashboard/data-tabel" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Edit Data Menara</h1>
            <p className="text-slate-500 text-sm mt-1">Ubah informasi infrastruktur menara komunikasi.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <EditForm initialData={initialData} />
        </div>
      </div>
    </div>
  );
}
