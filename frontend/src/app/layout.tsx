import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/components/shared/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stellar ERP | Gestión Empresarial",
  description: "Sistema SaaS de facturación e inventario local",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-50 dark:bg-slate-950 flex h-screen overflow-hidden text-slate-900 dark:text-slate-100`}>
        <ThemeProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {children}
            {/* Glass Overlay for depth */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-50 dark:from-slate-950 via-slate-50/50 dark:via-slate-950/50 to-transparent pointer-events-none z-10" />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

