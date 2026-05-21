import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { AppShell } from "@/components/shared/AppShell";

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
      <body className="flex h-screen overflow-hidden transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            <AppShell>
              {children}
            </AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

