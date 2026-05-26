"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  ChevronLeft, 
  Mail, 
  Lock, 
  AlertCircle,
  Code,
  Globe,
  Smartphone,
  CheckCircle2
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTheme } from "@/components/ThemeProvider";

const loginSchema = z.object({
  login: z.string().min(1, "Email atau Username wajib diisi"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { theme } = useTheme();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    const signup = params.get("signup");
    
    if (err) {
      setServerError("Kredensial tidak valid. Silakan coba lagi.");
      window.history.replaceState(null, "", "/login");
    }
    
    if (signup === "success") {
      setSuccessMessage("Akun berhasil dibuat! Silakan masuk dengan email Anda.");
      window.history.replaceState(null, "", "/login");
    }
  }, []);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setServerError("");

    try {
      const res = await signIn("credentials", {
        login: data.login,
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        setServerError("Maaf, akun atau password yang Anda masukkan salah.");
        setIsLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setServerError("Terjadi kendala pada sistem. Silakan coba beberapa saat lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Panel - Brand & Context (Desktop Only) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative flex-col justify-between p-12 bg-zinc-950 text-white overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-50" />
        
        {/* Abstract Pattern / Static Mockup Placeholder */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg opacity-20 pointer-events-none">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-primary fill-current">
            <path d="M45.7,-78.3C58.9,-71.4,69.2,-58.5,76.5,-44.4C83.8,-30.3,88.1,-15.1,87.6,-0.3C87,14.5,81.6,29,73.6,41.9C65.5,54.8,54.8,66,41.9,73.1C29,80.2,14.5,83.1,-0.5,84C-15.6,84.9,-31.1,83.8,-44.6,77.1C-58.1,70.3,-69.5,57.9,-76.3,43.9C-83.1,29.9,-85.4,14.9,-85,0.2C-84.6,-14.5,-81.6,-29,-73.9,-41.4C-66.2,-53.8,-53.8,-64.1,-40.1,-70.7C-26.4,-77.3,-13.2,-80.1,1.1,-82.1C15.4,-84,32.4,-85.2,45.7,-78.3Z" transform="translate(100 100)" />
          </svg>
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/tacet-white.png" alt="Logo" className="w-10 h-10 object-contain" />
            <span className="font-bold text-xl tracking-tight">Rabelle</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl xl:text-5xl font-bold tracking-tight leading-tight mb-6"
          >
            Intelijen Geografis <br /> untuk Masa Depan.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-zinc-400 text-lg font-medium leading-relaxed"
          >
            Platform pemetaan infrastruktur telekomunikasi yang presisi, cepat, dan terpercaya.
          </motion.p>
        </div>

        <div className="relative z-10">
          <p className="text-zinc-500 text-sm font-medium">© 2026 Rabelle Geographic Intelligence.</p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-grow flex items-center justify-center p-6 lg:p-12 relative">
        {/* Mobile Header */}
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-3">
          <img src={theme === "dark" ? "/tacet-white.png" : "/logo.png"} alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg text-foreground">Rabelle</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-[400px] space-y-8"
        >
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Selamat Datang</h2>
            <p className="text-muted-foreground font-medium">Masuk untuk melanjutkan ke dashboard Anda.</p>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-1 gap-3">
            <button className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-secondary transition-all font-bold text-sm group">
              <Globe size={18} className="group-hover:scale-110 transition-transform" />
              <span>Lanjutkan dengan Google</span>
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-secondary transition-all font-bold text-sm group">
                <Code size={18} className="group-hover:scale-110 transition-transform" />
                <span>GitHub</span>
              </button>
              <button className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-secondary transition-all font-bold text-sm group">
                <Smartphone size={18} className="group-hover:scale-110 transition-transform" />
                <span>Apple</span>
              </button>
            </div>
          </div>

            <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-background px-3 text-muted-foreground">atau gunakan kredensial</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <AnimatePresence mode="wait">
              {serverError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold p-3 rounded-xl flex items-center gap-3"
                >
                  <AlertCircle size={16} />
                  {serverError}
                </motion.div>
              )}
              {successMessage && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold p-3 rounded-xl flex items-center gap-3"
                >
                  <CheckCircle2 size={16} />
                  {successMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[13px] font-bold text-secondary tracking-tight">Username atau Email</label>
              </div>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Mail size={16} />
                </div>
                <input 
                  {...register("login")}
                  type="text"
                  autoComplete="username"
                  className={`
                    w-full pl-10 pr-4 py-3 rounded-xl border bg-secondary/30 outline-none transition-all font-medium text-sm
                    ${errors.login ? "border-destructive focus:ring-destructive/20" : "border-border focus:border-primary focus:ring-4 focus:ring-primary/10"}
                  `}
                  placeholder="Username / Email yang terhubung"
                />
              </div>
              {errors.login && (
                <p className="text-[11px] font-bold text-destructive flex items-center gap-1">
                   {errors.login.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[13px] font-bold text-secondary tracking-tight">Password</label>
                <Link href="/forgot-password" title="Lupa password?" className="text-xs font-bold text-primary hover:underline">
                  Lupa?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Lock size={16} />
                </div>
                <input 
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className={`
                    w-full pl-10 pr-12 py-3 rounded-xl border bg-secondary/30 outline-none transition-all font-medium text-sm
                    ${errors.password ? "border-destructive focus:ring-destructive/20" : "border-border focus:border-primary focus:ring-4 focus:ring-primary/10"}
                  `}
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] font-bold text-destructive flex items-center gap-1">
                   {errors.password.message}
                </p>
              )}
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Memproses...
                </>
              ) : "Masuk ke Dashboard"}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground font-medium">
              Belum memiliki akun? {" "}
              <Link href="/register" className="text-primary font-bold hover:underline transition-all">
                Daftar Sekarang
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Back link */}
        <Link 
          href="/" 
          className="absolute bottom-8 left-8 lg:left-auto lg:right-8 flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
