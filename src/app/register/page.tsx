"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/app/actions/auth";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await registerUser(formData);

    if (result.error) {
      if (result.exists) {
        // Pass error through query param so login page can show it, or just use localStorage/sessionStorage
        // We'll redirect to login with query param
        router.push(`/login?error=${encodeURIComponent(result.error)}`);
      } else {
        setError(result.error);
        setLoading(false);
      }
    } else if (result.success) {
      // Auto login or just redirect to login
      router.push("/login");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative bg-[#f5f5f7] py-12">
      {/* Back to Home */}
      <Link href="/" className="absolute top-8 left-8 flex items-center text-[#007AFF] hover:underline font-medium">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Kembali ke Beranda
      </Link>

      <div className="bg-white/85 backdrop-blur-[20px] border border-white/50 shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-[24px] w-full max-w-md p-10 flex flex-col items-center mx-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-lg mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-2 tracking-tight">Buat Akun Rabelle</h2>
        <p className="text-gray-500 mb-8 text-sm">Daftar untuk mulai menggunakan fitur.</p>

        {error && (
          <div className="bg-red-50 text-red-500 border border-red-100 p-3 rounded-xl mb-6 w-full text-center text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <input 
              type="text" 
              name="name" 
              placeholder="Nama Lengkap" 
              required
              className="bg-black/5 border border-black/5 focus:bg-white focus:border-[#007AFF] focus:ring-[3px] focus:ring-[#007AFF]/20 transition-all w-full px-4 py-3 rounded-xl text-[#1d1d1f] outline-none" 
            />
          </div>
          <div>
            <input 
              type="text" 
              name="username" 
              placeholder="Username Unik" 
              required
              className="bg-black/5 border border-black/5 focus:bg-white focus:border-[#007AFF] focus:ring-[3px] focus:ring-[#007AFF]/20 transition-all w-full px-4 py-3 rounded-xl text-[#1d1d1f] outline-none" 
            />
          </div>
          <div>
            <input 
              type="email" 
              name="email" 
              placeholder="Email" 
              required
              className="bg-black/5 border border-black/5 focus:bg-white focus:border-[#007AFF] focus:ring-[3px] focus:ring-[#007AFF]/20 transition-all w-full px-4 py-3 rounded-xl text-[#1d1d1f] outline-none" 
            />
          </div>
          <div>
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              required
              className="bg-black/5 border border-black/5 focus:bg-white focus:border-[#007AFF] focus:ring-[3px] focus:ring-[#007AFF]/20 transition-all w-full px-4 py-3 rounded-xl text-[#1d1d1f] outline-none" 
            />
          </div>
          <div>
            <input 
              type="password" 
              name="confirmPassword" 
              placeholder="Konfirmasi Password" 
              required
              className="bg-black/5 border border-black/5 focus:bg-white focus:border-[#007AFF] focus:ring-[3px] focus:ring-[#007AFF]/20 transition-all w-full px-4 py-3 rounded-xl text-[#1d1d1f] outline-none" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="bg-[#007AFF] hover:bg-[#0066CC] active:scale-95 transition-all w-full text-white font-semibold py-3 rounded-xl shadow-md mt-6 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Daftar Sekarang"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Sudah punya akun? 
            <Link href="/login" className="text-[#007AFF] font-medium hover:underline ml-1">Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
