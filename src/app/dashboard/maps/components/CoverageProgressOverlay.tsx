import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface CoverageProgressOverlayProps {
  isComputingCoverage: boolean;
  coverageProgress: number;
}

export default function CoverageProgressOverlay({
  isComputingCoverage,
  coverageProgress
}: CoverageProgressOverlayProps) {
  return (
    <AnimatePresence>
      {isComputingCoverage && (
        <motion.div 
          key="rf-calculator" 
          initial={{ opacity: 0, scale: 0.9, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.9, y: 20 }} 
          className="absolute bottom-10 right-14 z-[2000]"
        >
          <div className="bg-slate-900/95 backdrop-blur-xl text-white border border-slate-700/50 shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-2xl px-5 py-4 flex flex-col items-center gap-3 min-w-[240px]">
            <div className="flex items-center gap-3">
              <Loader2 size={18} className="animate-spin text-emerald-400" />
              <span className="text-sm font-semibold tracking-wide">Mengkalkulasi RF...</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full transition-all duration-300 ease-out" 
                style={{ width: `${Math.max(2, coverageProgress)}%` }} 
              />
            </div>
            <span className="text-[10px] text-slate-400 font-mono font-medium tracking-widest">
              {Math.min(100, coverageProgress)}% SELESAI
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
