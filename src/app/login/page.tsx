"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      setError(err);
      // clean url
      window.history.replaceState(null, "", "/login");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        login,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Kredensial tidak valid. Silakan coba lagi.");
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative bg-[#f5f5f7]">
      {/* Back to Home */}
      <Link href="/" className="absolute top-8 left-8 flex items-center text-[#007AFF] hover:underline font-medium">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Kembali ke Beranda
      </Link>

      <div className="bg-white/85 backdrop-blur-[20px] border border-white/50 shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-[24px] w-full max-w-md p-10 flex flex-col items-center mx-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-lg mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path></svg>
        </div>
        <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-2 tracking-tight">Login ke Rabelle</h2>
        <p className="text-gray-500 mb-8 text-sm">Masuk untuk mengakses fitur lengkap</p>

        {error && (
          <div className="bg-red-50 text-red-500 border border-red-100 p-3 rounded-xl mb-6 w-full text-center text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <input 
              type="text" 
              name="login" 
              placeholder="Email atau Username" 
              required
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="bg-black/5 border border-black/5 focus:bg-white focus:border-[#007AFF] focus:ring-[3px] focus:ring-[#007AFF]/20 transition-all w-full px-4 py-3 rounded-xl text-[#1d1d1f] outline-none" 
            />
          </div>
          <div>
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black/5 border border-black/5 focus:bg-white focus:border-[#007AFF] focus:ring-[3px] focus:ring-[#007AFF]/20 transition-all w-full px-4 py-3 rounded-xl text-[#1d1d1f] outline-none" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="bg-[#007AFF] hover:bg-[#0066CC] active:scale-95 transition-all w-full text-white font-semibold py-3 rounded-xl shadow-md mt-4 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Belum punya akun? 
            <Link href="/register" className="text-[#007AFF] font-medium hover:underline ml-1">Daftar Baru</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
