"use client";

import { useState, useEffect, Fragment } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { salesService, Sale } from "@/services/businessServices";
import { Search, ChevronDown, ChevronUp, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "@/lib/format";
import { formatBS, formatUSD, convertToBS } from "@/lib/currency";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const data = await salesService.getAll({ limit: 200 });
      const sorted = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setSales(sorted);
    } catch (err) {
      console.error("Error fetching sales:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const filteredSales = sales.filter((s) =>
    `#${s.id}`.includes(searchQuery) ||
    s.total_amount_bs.toString().includes(searchQuery) ||
    s.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.customer_dni?.includes(searchQuery)
  );

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / PAGE_SIZE));
  const paginatedSales = filteredSales.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <main className="flex-1 p-8 overflow-auto w-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Historial de Ventas</h2>
          <p className="text-slate-500 font-medium">Todas las transacciones registradas en el POS.</p>
        </div>
        <Button
          onClick={fetchSales}
          className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
        >
          Refrescar
        </Button>
      </header>

      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl w-full">
        <CardHeader className="p-6 border-b border-slate-50 dark:border-slate-800">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por #ID o monto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="px-6 py-4 w-16">#</th>
                  <th className="px-6 py-4 w-32">Fecha</th>
                  <th className="px-6 py-4">Cliente / Artículos</th>
                  <th className="px-6 py-4 w-20 text-center">Arts.</th>
                  <th className="px-6 py-4 w-44 text-right">Total</th>
                  <th className="px-6 py-4 w-16 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-400 font-medium">Cargando ventas...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedSales.map((sale, i) => (
                  <Fragment key={sale.id}>
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="group hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === sale.id ? null : sale.id)}
                    >
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">#{sale.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          {formatDate(sale.timestamp)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5 max-w-full">
                          <span className="text-sm font-bold text-slate-800 dark:text-white truncate">
                            {sale.customer_name || "Cliente General"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {sale.customer_dni ? `C.I: ${sale.customer_dni}` : "Sin ID"} • {sale.details.length} refs
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 capitalize pt-1">
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              sale.payment_method === "Transfer" ? "bg-blue-400" :
                              sale.payment_method === "Card" ? "bg-amber-400" : "bg-emerald-400"
                            )} />
                            {sale.payment_method === "Transfer" ? "Transferencia" : 
                             sale.payment_method === "Card" ? "Tarjeta" : "Efectivo"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          {sale.details.reduce((sum, d) => sum + d.quantity, 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-emerald-600 dark:text-emerald-400">
                            {formatUSD(sale.total_amount_bs / (sale.exchange_rate || 1))}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {formatBS(sale.total_amount_bs)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400">
                          {expandedId === sale.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </td>
                    </motion.tr>
                    <AnimatePresence>
                      {expandedId === sale.id && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <td colSpan={6} className="px-6 py-6 bg-slate-50/50 dark:bg-slate-800/30 border-y border-slate-100 dark:border-slate-800">
                            <div className="max-w-3xl mx-auto space-y-6">
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Detalles de la Transacción</p>
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                  sale.payment_method === "Transfer" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                                  sale.payment_method === "Card" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                                  "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400"
                                )}>
                                  {sale.payment_method === "Transfer" ? "Transferencia" : 
                                   sale.payment_method === "Card" ? "Tarjeta" : "Efectivo"}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-black uppercase text-slate-400">Tasa de cambio aplicada:</span>
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                  1 USD = {formatBS(sale.exchange_rate || 0)}
                                </span>
                              </div>

                              <div className="space-y-3">
                                {sale.details.map((det) => (
                                  <div key={det.id} className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 group/item transition-all hover:shadow-md">
                                    <div className="flex items-center gap-4 min-w-0">
                                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                        <ShoppingCart className="w-5 h-5 text-slate-300 group-hover/item:text-emerald-500 transition-colors" />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                          {det.product_name || `Producto #${det.product_id}`}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium tracking-tight">
                                          {det.quantity} unidad{det.quantity > 1 ? 'es' : ''} × {formatUSD(det.unit_price_bs / (sale.exchange_rate || 1))} ({formatBS(det.unit_price_bs)})
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0">
                                      <span className="font-black text-slate-900 dark:text-white">
                                        {formatUSD(det.unit_price_bs * det.quantity / (sale.exchange_rate || 1))}
                                      </span>
                                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                        {formatBS(det.unit_price_bs * det.quantity)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs">
                                  <span>Subtotal</span>
                                  <div className="flex flex-col items-end">
                                  <span>{formatUSD(sale.total_amount_bs / (sale.exchange_rate || 1))}</span>
                                  <span className="text-[10px]">{formatBS(sale.total_amount_bs)}</span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center text-lg font-black text-slate-900 dark:text-white">
                                  <span>Total Cobrado</span>
                                  <div className="flex flex-col items-end">
                                    <span className="text-emerald-600 dark:text-emerald-400 tracking-tighter">{formatUSD(sale.total_amount_bs / (sale.exchange_rate || 1))}</span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{formatBS(sale.total_amount_bs)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                ))}
                {filteredSales.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                          <ShoppingCart className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="text-slate-400 font-medium italic">No hay ventas registradas</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500">
                Página {page} de {totalPages} ({filteredSales.length} ventas)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline" size="icon"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 w-8 rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[3rem] text-center">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline" size="icon"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 w-8 rounded-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}