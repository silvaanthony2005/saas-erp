"use client";

import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import ExchangeRateModal from "@/components/shared/ExchangeRateModal";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      window.location.href = "/login";
    }
  }, [loading, user, isLoginPage]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  return (
    <>
      <ExchangeRateModal />
      <Sidebar />
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {children}
      </div>
    </>
  );
}
