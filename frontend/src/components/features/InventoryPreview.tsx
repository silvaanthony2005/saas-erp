"use client";

import { useInventory } from "@/hooks/useInventory";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Package, RefreshCw, AlertCircle, Search } from "lucide-react";
import { motion } from "framer-motion";
import { formatBS } from "@/lib/currency";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function InventoryPreview() {
  const { items, loading, error, refreshInventory } = useInventory();

  if (loading) return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-none shadow-slate-200/50 p-12 flex items-center justify-center min-h-[200px]">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="w-8 h-8 text-slate-300 animate-spin" />
        <p className="text-slate-400 font-medium">Cargando inventario...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-none shadow-slate-200/50 p-8">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-rose-400" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white">Error de conexión</h4>
          <p className="text-sm text-slate-400">{error}</p>
        </div>
        <Button variant="secondary" onClick={refreshInventory} className="mt-2 rounded-xl">
          Reintentar
        </Button>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-none shadow-slate-200/50 overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Inventario en Tiempo Real</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={refreshInventory} title="Refrescar" className="rounded-xl">
          <RefreshCw className="w-4 h-4 text-slate-400 hover:text-blue-500 transition-colors" />
        </Button>
      </div>
      <div className="p-0">
        <div className="w-full">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[40%]" />
              <col className="w-[22%]" />
              <col className="w-[18%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Precio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {items.slice(0, 5).map((item, i) => (
                <motion.tr 
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-sm truncate">{item.name}</td>
                  <td className="px-6 py-4 font-medium text-slate-400 text-sm">{item.sku}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold",
                      item.stock_quantity < 10
                        ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                        : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                    )}>
                      {item.stock_quantity} uds
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-sm">{formatBS(item.sale_price_bs)}</td>
                </motion.tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <Search className="w-7 h-7 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-medium italic">No hay productos registrados</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {items.length > 5 && (
          <div className="px-5 pb-5 pt-2 text-center">
            <Link
              href="/inventory"
              className="inline-flex items-center justify-center w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-100 dark:border-slate-800 gap-2"
            >
              <Package className="w-4 h-4" />
              Ver Inventario Completo
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}


