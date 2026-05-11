import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import Sidebar from "./Sidebar";
import { IdleProvider } from "./IdleProvider";
import DashboardHeader from "./DashboardHeader";
import { PreferencesProvider } from "./PreferencesProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <IdleProvider>
      <PreferencesProvider>
        <div className="flex bg-background min-h-screen text-foreground transition-colors duration-300">
          {/* Sidebar */}
          <Sidebar session={session} />

          {/* Main Content */}
          <div className="flex-1 flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <DashboardHeader session={session} />

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto relative bg-background/50">
              {children}
            </main>
          </div>
        </div>
      </PreferencesProvider>
    </IdleProvider>
  );
}
