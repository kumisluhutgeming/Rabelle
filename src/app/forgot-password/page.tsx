"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Mail, 
  Loader2, 
  ChevronLeft, 
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const forgotSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormValues) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="absolute top-8 left-8 flex items-center gap-3">
        <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
        <span className="font-bold text-lg text-foreground">Rabelle</span>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] space-y-8"
      >
        {!isSubmitted ? (
          <>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Lupa Password?</h2>
              <p className="text-muted-foreground font-medium">Jangan khawatir, kami akan mengirimkan instruksi pemulihan ke email Anda.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-secondary tracking-tight ml-1">Alamat Email</label>
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

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    Kirim Instruksi
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto">
              <CheckCircle2 size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Email Terkirim!</h2>
              <p className="text-muted-foreground font-medium leading-relaxed">
                Kami telah mengirimkan tautan pemulihan password ke email Anda. Silakan periksa kotak masuk atau folder spam Anda.
              </p>
            </div>
            <Link 
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
            >
              Kembali ke Halaman Login
            </Link>
          </div>
        )}

        <div className="text-center">
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Kembali ke Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
