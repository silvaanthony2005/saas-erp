import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/components/shared/ThemeProvider";

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
      <body className="bg-slate-50 dark:bg-slate-950 flex h-screen overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <ThemeProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

