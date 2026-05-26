"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Pagination({ totalPages, currentPage, params }: { totalPages: number, currentPage: number, params: any }) {
  const router = useRouter();
  const [jumpPage, setJumpPage] = useState("");
  const [isJumping, setIsJumping] = useState(false);

  const createUrl = (page: number) => {
    const p = new URLSearchParams();
    if (params.jenis) p.set("jenis", params.jenis);
    if (params.provinsi) p.set("provinsi", params.provinsi);
    if (params.kota) p.set("kota", params.kota);
    if (params.operator) p.set("operator", params.operator);
    if (params.search) p.set("search", params.search);
    p.set("page", page.toString());
    return `?${p.toString()}`;
  };

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPage);
    if (p >= 1 && p <= totalPages) {
      router.push(createUrl(p));
      setIsJumping(false);
    }
  };

  return (
    <div className="flex flex-col items-center mt-6 gap-5 border-t border-slate-100 pt-8">
      <div className="flex items-center gap-1 bg-slate-50/50 p-1 rounded-2xl border border-slate-100">
        {/* First */}
        <Link 
          href={createUrl(1)} 
          scroll={false}
          className={`px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-all rounded-lg ${currentPage === 1 ? 'text-slate-300 pointer-events-none' : 'text-slate-700 hover:bg-slate-100 hover:text-indigo-600'}`}
        >
          &lt;&lt; First
        </Link>

        {/* Prev */}
        <Link 
          href={createUrl(Math.max(1, currentPage - 1))} 
          scroll={false}
          className={`px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-all rounded-lg ${currentPage === 1 ? 'text-slate-300 pointer-events-none' : 'text-slate-700 hover:bg-slate-100 hover:text-indigo-600'}`}
        >
          &lt; Prev
        </Link>

        {/* Jump/Seek */}
        <div className="relative">
          {isJumping ? (
            <form onSubmit={handleJump} className="flex items-center gap-1 animate-in fade-in slide-in-from-right-1 duration-200">
              <input 
                type="number" 
                min={1} 
                max={totalPages}
                value={jumpPage}
                onChange={(e) => setJumpPage(e.target.value)}
                autoFocus
                className="w-16 px-2 py-1.5 text-xs border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                placeholder="Hal..."
              />
              <button type="submit" className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </button>
              <button type="button" onClick={() => setIsJumping(false)} className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </form>
          ) : (
            <button 
              onClick={() => setIsJumping(true)}
              className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-all rounded-lg"
            >
              Jump/Seek
            </button>
          )}
        </div>

        {/* Next */}
        <Link 
          href={createUrl(Math.min(totalPages, currentPage + 1))} 
          scroll={false}
          className={`px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-all rounded-lg ${currentPage === totalPages ? 'text-slate-300 pointer-events-none' : 'text-slate-700 hover:bg-slate-100 hover:text-indigo-600'}`}
        >
          Next &gt;
        </Link>

        {/* Last */}
        <Link 
          href={createUrl(totalPages)} 
          scroll={false}
          className={`px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-all rounded-lg ${currentPage === totalPages ? 'text-slate-300 pointer-events-none' : 'text-slate-700 hover:bg-slate-100 hover:text-indigo-600'}`}
        >
          Last &gt;&gt;
        </Link>
      </div>
      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">
        Halaman <span className="text-indigo-600">{currentPage}</span> / <span className="text-slate-800">{totalPages}</span>
      </p>
    </div>
  );
}
