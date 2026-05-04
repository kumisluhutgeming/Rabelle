import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import Sidebar from "./Sidebar";
import { IdleProvider } from "./IdleProvider";
import DashboardHeader from "./DashboardHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <IdleProvider>
      <div className="flex bg-[#f5f5f7] min-h-screen text-[#1d1d1f]">
        {/* Sidebar */}
        <Sidebar session={session} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <DashboardHeader session={session} />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto relative">
            {children}
          </main>
        </div>
      </div>
    </IdleProvider>
  );
}
