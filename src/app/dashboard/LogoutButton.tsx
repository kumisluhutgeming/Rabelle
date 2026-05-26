"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton({ isCollapsed }: { isCollapsed?: boolean }) {
  return (
    <button 
      title="Keluar"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center justify-center gap-3 p-3 bg-white text-red-500 border border-red-100 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all w-full font-medium"
    >
      <LogOut size={20} className="shrink-0" />
      {!isCollapsed && <span className="whitespace-nowrap">Keluar</span>}
    </button>
  );
}
