"use client";

import { StatCard } from "@/components/shared/StatCard";
import { PerformanceChart } from "@/components/shared/PerformanceChart";
import { InventoryPreview } from "@/components/features/InventoryPreview";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DollarSign, Wallet, Users, ChevronRight, TrendingDown, Package, AlertTriangle, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { dashboardService, type DashboardData, type LowStockItem, type TopProduct, type RecentActivity, type SalesByCategory } from "@/services/businessServices";
import { formatUSD } from "@/lib/currency";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import Link from "next/link";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { rate: currentExchangeRate } = useExchangeRate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const dashboardData = await dashboardService.getAll();
        setData(dashboardData);
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <main className="flex-1 p-6 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  const stats = data?.stats || {
    total_sales: 0,
    total_expenses: 0,
    gross_margin: 0,
    active_employees: 0
  };

  const dailySales = data?.daily_sales || [];
  const lowStock = data?.low_stock || [];
  const topProducts = data?.top_products || [];
  const recentActivity = data?.recent_activity || [];
  
  // Limitar actividad reciente a los últimos 6 elementos para evitar crecimiento infinito
  const displayActivity = recentActivity.slice(0, 6);
  
  const salesByCategory = data?.sales_by_category || [];

  const categoryPercentages = salesByCategory.map(cat => {
    const total = salesByCategory.reduce((sum, c) => sum + c.value, 0);
    return { ...cat, percentage: total > 0 ? (cat.value / total) * 100 : 0 };
  });

  return (
    <main className="flex-1 p-6 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-950">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Ventas Totales" 
            value={formatUSD(stats.total_sales / currentExchangeRate)} 
            icon={DollarSign} 
            trend=""
            color="bg-gradient-to-br from-blue-600 to-blue-700" 
            delay={0}
          />
          <StatCard 
            label="Gastos Operativos" 
            value={formatUSD(stats.total_expenses / currentExchangeRate)} 
            icon={Wallet} 
            trend=""
            color="bg-gradient-to-br from-violet-600 to-violet-700" 
            delay={0.05}
          />
          <StatCard 
            label="Margen Bruto" 
            value={`${stats.gross_margin}%`} 
            icon={TrendingDown} 
            trend=""
            color="bg-gradient-to-br from-emerald-600 to-emerald-700" 
            delay={0.1}
          />
          <StatCard 
            label="Empleados Activos" 
            value={`${stats.active_employees}`} 
            icon={Users} 
            trend=""
            color="bg-gradient-to-br from-rose-600 to-rose-700" 
            delay={0.15}
          />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-none shadow-slate-200/50 overflow-hidden h-full">
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blue-500" />
                      Ventas por Categoría
                    </h3>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mes actual</span>
                  </div>
                  <div className="p-5 space-y-4">
                    {categoryPercentages.length > 0 ? categoryPercentages.map((cat, i) => (
                      <div key={cat.category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{cat.category}</span>
                          <span className="font-bold text-slate-900 dark:text-white">{formatUSD(cat.value / currentExchangeRate)}</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${cat.percentage}%` }}
                            transition={{ delay: 0.3 + (i * 0.1), duration: 0.6, ease: "easeOut" }}
                            className="h-full bg-emerald-500 rounded-full"
                          />
                        </div>
                      </div>
                    )) : (
                      <p className="text-center text-slate-400 py-8">Sin datos de ventas</p>
                    )}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Card className="h-full overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <CardTitle className="text-base text-slate-900 dark:text-white">Alertas de Stock</CardTitle>
                    </div>
                    <span className="text-xs font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-full">
                      {lowStock.length} alertas
                    </span>
                  </CardHeader>
                  <CardContent className="p-0">
                    {lowStock.length > 0 ? (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {lowStock.map((item: LowStockItem, i: number) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 + (i * 0.05) }}
                            className="px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white text-sm truncate" title={item.name}>{item.name}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{item.category}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-rose-500 dark:text-rose-400">{item.stock_quantity} uds</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">Mín: {item.min_stock}</p>
                              </div>
                            </div>
                            <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full"
                                style={{ width: `${Math.min(100, (item.stock_quantity / item.min_stock) * 100)}%` }}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No hay alertas de stock</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <PerformanceChart data={dailySales.length > 0 ? dailySales.map(d => ({ ...d, value: d.value / currentExchangeRate })) : [{ day: "Sin datos", value: 0 }]} />
            </motion.div>
          </div>

          <div className="xl:col-span-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 p-5">
                  <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-white">
                    <Package className="w-5 h-5 text-emerald-500" />
                    Productos Más Vendidos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {topProducts.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {topProducts.map((product: TopProduct, i: number) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + (i * 0.05) }}
                          className="px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                                {i + 1}
                              </span>
                              <span className="font-semibold text-slate-900 dark:text-white text-sm truncate" title={product.name}>{product.name}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-slate-900 dark:text-white text-sm">{formatUSD(product.total_revenue / currentExchangeRate)}</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">{product.total_sold} ventas</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Sin datos de ventas</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 p-5">
                  <CardTitle className="text-base text-slate-900 dark:text-white">Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="min-h-[380px] flex flex-col justify-between">
                    {displayActivity.length > 0 ? (
                      <div className="space-y-6">
                        {displayActivity.map((act: RecentActivity, i: number) => (
                          <motion.div
                            key={`${act.type}-${act.id}-${i}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.45 + (i * 0.05) }}
                            className="flex items-center justify-between group overflow-hidden"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 group-hover:bg-emerald-500 transition-colors shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate block" title={act.description}>{act.description}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">{act.time_ago}</p>
                              </div>
                            </div>
                            <span className="text-sm font-black text-slate-900 dark:text-white shrink-0 ml-4">{act.amount}</span>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-slate-400 py-10 flex-1 flex flex-col items-center justify-center">
                        <Package className="w-8 h-8 opacity-20 mb-2" />
                        <p className="text-sm italic">Sin actividad reciente</p>
                      </div>
                    )}
                    
                    <Link href="/sales" className="w-full mt-6 py-3.5 rounded-[22px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[11px] uppercase tracking-[0.1em] hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-lg shadow-slate-200 dark:shadow-none flex items-center justify-center gap-2 group/btn">
                      Ver Historial Completo
                      <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <InventoryPreview />
        </motion.div>
      </div>
    </main>
  );
}