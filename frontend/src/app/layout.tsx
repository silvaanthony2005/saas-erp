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
    <html lang="es" suppressHydrationWarning className="light">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark' || theme === 'light') {
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-slate-50 dark:bg-slate-950 flex h-screen overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-200`}>
        <ThemeProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {children}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-50 dark:from-slate-950 via-slate-50/50 dark:via-slate-950/50 to-transparent pointer-events-none z-10" />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

