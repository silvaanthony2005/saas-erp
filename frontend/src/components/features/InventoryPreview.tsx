"use client";

import { useInventory } from "@/hooks/useInventory";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Package, RefreshCw, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export function InventoryPreview() {
  const { items, loading, error, refreshInventory } = useInventory();

  if (loading) return (
    <Card className="p-8 flex items-center justify-center min-h-[200px]">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-500 font-medium">Cargando inventario...</p>
      </div>
    </Card>
  );

  if (error) return (
    <Card className="p-8 border-rose-100 bg-rose-50/50">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-rose-500" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900">Error al conectar</h4>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
        <Button variant="secondary" onClick={refreshInventory} className="mt-2">
          Reintentar
        </Button>
      </div>
    </Card>
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 p-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Package className="w-5 h-5" />
          </div>
          <CardTitle className="text-base text-slate-900 dark:text-white">Inventario en Tiempo Real</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={refreshInventory} title="Refrescar">
          <RefreshCw className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/20 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Precio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.slice(0, 5).map((item, i) => (
                <motion.tr 
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-slate-900 text-sm">{item.name}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm font-medium">{item.sku}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-xs font-bold",
                      item.stock_quantity < 10 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                    )}>
                      {item.stock_quantity} uds
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 text-sm">${formatNumber(item.sale_price)}</td>
                </motion.tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                    No hay productos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {items.length > 5 && (
          <div className="p-4 border-t border-slate-50 text-center">
            <Button variant="ghost" className="text-xs text-blue-600 font-bold uppercase tracking-widest">
              Ver Inventario Completo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


