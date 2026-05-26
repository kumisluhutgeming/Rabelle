"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteTowerData } from "./actions";
import { Loader2, Trash2, Edit } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ActionButtons({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data ini secara permanen?")) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteTowerData(id);
    setIsDeleting(false);

    if (result.success) {
      // router.refresh() dipanggil otomatis oleh revalidatePath di server, tapi jika perlu bisa dipanggil eksplisit.
    } else {
      alert(result.message);
    }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Link 
        href={`/dashboard/data-tabel/${id}/edit`}
        className="inline-flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-indigo-100"
        title="Edit Data"
      >
        <Edit size={14} className="mr-1" /> Edit
      </Link>
      
      <button 
        onClick={handleDelete}
        disabled={isDeleting}
        className="inline-flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-red-100 disabled:opacity-50"
        title="Hapus Data"
      >
        {isDeleting ? (
          <><Loader2 size={14} className="animate-spin mr-1" /> Hapus...</>
        ) : (
          <><Trash2 size={14} className="mr-1" /> Hapus</>
        )}
      </button>
    </div>
  );
}
