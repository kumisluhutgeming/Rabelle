"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  ChevronLeft, 
  AlertCircle,
  Globe,
  Code,
  Smartphone,
  CheckCircle2,
  AtSign
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { registerUser } from "@/app/actions/auth";
import { useTheme } from "@/components/ThemeProvider";

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  username: z.string().min(3, "Username minimal 3 karakter").regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { theme } = useTheme();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setServerError("");

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("username", data.username);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("confirmPassword", data.confirmPassword);

    try {
      const result = await registerUser(formData);

      if (result.error) {
        if (result.exists) {
          router.push(`/login?error=${encodeURIComponent(result.error)}`);
        } else {
          setServerError(result.error);
          setIsLoading(false);
        }
      } else if (result.success) {
        router.push("/login?signup=success");
      }
    } catch (err) {
      setServerError("Terjadi kendala pada sistem. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Panel - Brand & Context */}
      <div className="hidden lg:flex lg:w-[40%] xl:w-[45%] relative flex-col justify-between p-12 bg-zinc-950 text-white overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-50" />
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/tacet-white.png" alt="Logo" className="w-10 h-10 object-contain" />
            <span className="font-bold text-xl tracking-tight">Rabelle</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider mb-6">
            <CheckCircle2 size={12} />
            Hanya butuh 1 menit
          </div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl xl:text-5xl font-bold tracking-tight leading-tight mb-6"
          >
            Mulai Petualangan <br /> Data Anda.
          </motion.h1>
          <ul className="space-y-4 text-zinc-400 font-medium">
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                <CheckCircle2 size={14} />
              </div>
              Gratis untuk mulai digunakan
            </li>
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                <CheckCircle2 size={14} />
              </div>
              Akses ke ribuan data infrastruktur
            </li>
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                <CheckCircle2 size={14} />
              </div>
              Visualisasi peta yang interaktif
            </li>
          </ul>
        </div>

        <div className="relative z-10">
          <p className="text-zinc-500 text-sm font-medium">Bergabunglah dengan ratusan pengembang lainnya.</p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-grow flex items-center justify-center p-6 lg:p-12 relative overflow-y-auto">
        {/* Mobile Header */}
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-3">
          <img src={theme === "dark" ? "/tacet-white.png" : "/logo.png"} alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg text-foreground">Rabelle</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[440px] space-y-8 my-12"
        >
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Buat Akun Baru</h2>
            <p className="text-muted-foreground font-medium">Daftar sekarang, gratis dan tanpa kartu kredit.</p>
          </div>

          {/* Social Signups */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-card hover:bg-secondary transition-all font-bold text-[11px] uppercase tracking-wider">
              <Globe size={16} />
              Google
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-card hover:bg-secondary transition-all font-bold text-[11px] uppercase tracking-wider">
              <Code size={16} />
              GitHub
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-card hover:bg-secondary transition-all font-bold text-[11px] uppercase tracking-wider">
              <Smartphone size={16} />
              Apple
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-background px-3 text-muted-foreground">atau lanjut dengan email</span>
            </div>
          </div>

          {/* Signup Form */}
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
            </AnimatePresence>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-secondary tracking-tight ml-1">Nama Lengkap</label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <User size={16} />
                  </div>
                  <input 
                    {...register("name")}
                    type="text"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-secondary/30 outline-none transition-all font-medium text-sm ${errors.name ? "border-destructive focus:ring-destructive/20" : "border-border focus:border-primary focus:ring-4 focus:ring-primary/10"}`}
                    placeholder="Nama Anda"
                  />
                </div>
                {errors.name && <p className="text-[11px] font-bold text-destructive ml-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-secondary tracking-tight ml-1">Username</label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <AtSign size={16} />
                  </div>
                  <input 
                    {...register("username")}
                    type="text"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-secondary/30 outline-none transition-all font-medium text-sm ${errors.username ? "border-destructive focus:ring-destructive/20" : "border-border focus:border-primary focus:ring-4 focus:ring-primary/10"}`}
                    placeholder="user_baru"
                  />
                </div>
                {errors.username && <p className="text-[11px] font-bold text-destructive ml-1">{errors.username.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-secondary tracking-tight ml-1">Email</label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Mail size={16} />
                </div>
                <input 
                  {...register("email")}
                  type="email"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-secondary/30 outline-none transition-all font-medium text-sm ${errors.email ? "border-destructive focus:ring-destructive/20" : "border-border focus:border-primary focus:ring-4 focus:ring-primary/10"}`}
                  placeholder="name@example.com"
                />
              </div>
              {errors.email && <p className="text-[11px] font-bold text-destructive ml-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-secondary tracking-tight ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Lock size={16} />
                </div>
                <input 
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  className={`w-full pl-10 pr-12 py-3 rounded-xl border bg-secondary/30 outline-none transition-all font-medium text-sm ${errors.password ? "border-destructive focus:ring-destructive/20" : "border-border focus:border-primary focus:ring-4 focus:ring-primary/10"}`}
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
              {errors.password && <p className="text-[11px] font-bold text-destructive ml-1">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-secondary tracking-tight ml-1">Konfirmasi Password</label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Lock size={16} />
                </div>
                <input 
                  {...register("confirmPassword")}
                  type={showPassword ? "text" : "password"}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-secondary/30 outline-none transition-all font-medium text-sm ${errors.confirmPassword ? "border-destructive focus:ring-destructive/20" : "border-border focus:border-primary focus:ring-4 focus:ring-primary/10"}`}
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && <p className="text-[11px] font-bold text-destructive ml-1">{errors.confirmPassword.message}</p>}
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Mendaftarkan...
                </>
              ) : "Buat Akun Sekarang"}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground font-medium">
              Sudah memiliki akun? {" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Masuk di Sini
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
