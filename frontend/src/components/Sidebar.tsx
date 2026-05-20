"use client";

import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  CircleDollarSign,
  Settings,
  ChevronRight,
  ScrollText,
  Building2,
  FileText,
  CreditCard,
  Truck
} from "lucide-react";
import { ModeToggle } from "./shared/ModeToggle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", color: "text-blue-500", href: "/" },
  { icon: ShoppingCart, label: "POS / Ventas", color: "text-emerald-500", href: "/pos" },
  { icon: ScrollText, label: "Historial", color: "text-emerald-400", href: "/sales" },
  { icon: Users, label: "Clientes", color: "text-indigo-500", href: "/customers" },
  { icon: Package, label: "Inventario", color: "text-amber-500", href: "/inventory" },
  { icon: Building2, label: "Proveedores", color: "text-orange-500", href: "/suppliers" },
  { icon: Truck, label: "Compras", color: "text-cyan-500", href: "/purchases" },
  { icon: CreditCard, label: "CxP", color: "text-rose-500", href: "/accounts-payable" },
  { icon: CircleDollarSign, label: "Contabilidad", color: "text-violet-500", href: "/accounting" },
  { icon: Users, label: "Nómina / RRHH", color: "text-hr", href: "/hr" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 h-screen border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex flex-col p-6 sticky top-0">
      <div className="flex items-center justify-between mb-10 px-2 transition-all">
        <Link href="/" className="flex items-center gap-3 active:scale-95 transition-transform">
          <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center shadow-lg rotate-3">
            <div className="w-5 h-5 border-2 border-white dark:border-slate-900 rounded-sm rotate-45" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Stellar<span className="text-blue-600">ERP</span>
          </h1>
        </Link>
        <ModeToggle />
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-xl transition-all group relative overflow-hidden",
                isActive 
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xl translate-x-1" 
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              <div className="flex items-center gap-3 relative z-10">
                <item.icon className={cn("w-5 h-5", isActive ? (isActive && "dark:text-slate-900 text-white") : item.color)} />
                <span className="font-semibold">{item.label}</span>
              </div>
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute inset-0 bg-slate-900 dark:bg-slate-100 -z-10"
                />
              )}
              <ChevronRight className={cn(
                "w-4 h-4 transition-transform",
                isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
              )} />
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 px-2">
        <button className="flex items-center gap-3 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors w-full p-2">
          <Settings className="w-5 h-5" />
          <span className="font-medium">Configuración</span>
        </button>
      </div>
    </aside>
  );
}
