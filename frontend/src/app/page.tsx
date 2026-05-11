"use client";

import { StatCard } from "@/components/shared/StatCard";
import { PerformanceChart } from "@/components/shared/PerformanceChart";
import { InventoryPreview } from "@/components/features/InventoryPreview";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DollarSign, Wallet, Users, ChevronRight, TrendingDown, Package, AlertTriangle, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const WEEKLY_DATA = [
  { day: "Lun", value: 4000 },
  { day: "Mar", value: 7000 },
  { day: "Mie", value: 4500 },
  { day: "Jue", value: 9000 },
  { day: "Vie", value: 6500 },
  { day: "Sab", value: 8000 },
  { day: "Dom", value: 5000 },
];

const CATEGORY_DATA = [
  { name: "Alimentos", value: 45, color: "bg-amber-500" },
  { name: "Bebidas", value: 28, color: "bg-blue-500" },
  { name: "Limpieza", value: 18, color: "bg-emerald-500" },
  { name: "Otros", value: 9, color: "bg-slate-400 dark:bg-slate-600" },
];

const LOW_STOCK = [
  { name: "Harina Pan", stock: 8, threshold: 20, category: "Alimentos" },
  { name: "Aceite Vegetal", stock: 5, threshold: 15, category: "Alimentos" },
  { name: "Servilletas", stock: 12, threshold: 25, category: "Limpieza" },
];

const TOP_PRODUCTS = [
  { name: "Pan Integral", sales: 234, revenue: "$1,870" },
  { name: "Leche Entera", sales: 189, revenue: "$945" },
  { name: "Arroz Premium", sales: 156, revenue: "$1,248" },
  { name: "Azúcar Blanca", sales: 142, revenue: "$710" },
];

const RECENT_ACTIVITY = [
  { type: "Venta", desc: "Factura #1024", time: "Hace 5 min", amount: "+$250", color: "text-emerald-500 dark:text-emerald-400" },
  { type: "Gasto", desc: "Pago Electricidad", time: "Hace 2h", amount: "-$120", color: "text-rose-500 dark:text-rose-400" },
  { type: "Stock", desc: "Alerta: Harina Pan", time: "Hace 3h", amount: "Bajo", color: "text-amber-500 dark:text-amber-400" },
  { type: "Nómina", desc: "Recibo Juan Pérez", time: "Ayer", amount: "-$600", color: "text-rose-500 dark:text-rose-400" },
];

export default function DashboardPage() {
  return (
    <main className="flex-1 p-6 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-950">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Stats Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Ventas Totales" 
            value="$12,450" 
            icon={DollarSign} 
            trend="+12%" 
            color="bg-gradient-to-br from-blue-600 to-blue-700" 
            delay={0}
          />
          <StatCard 
            label="Gastos Operativos" 
            value="$4,200" 
            icon={Wallet} 
            trend="-5%" 
            color="bg-gradient-to-br from-violet-600 to-violet-700" 
            delay={0.05}
          />
          <StatCard 
            label="Margen Bruto" 
            value="66.3%" 
            icon={TrendingDown} 
            trend="+2.1%" 
            color="bg-gradient-to-br from-emerald-600 to-emerald-700" 
            delay={0.1}
          />
          <StatCard 
            label="Empleados Activos" 
            value="12" 
            icon={Users} 
            trend="+2" 
            color="bg-gradient-to-br from-rose-600 to-rose-700" 
            delay={0.15}
          />
        </section>

        {/* Middle Row - Charts + Sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 space-y-6">
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
                    {CATEGORY_DATA.map((cat, i) => (
                      <div key={cat.name} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{cat.name}</span>
                          <span className="font-bold text-slate-900 dark:text-white">{cat.value}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${cat.value}%` }}
                            transition={{ delay: 0.3 + (i * 0.1), duration: 0.6, ease: "easeOut" }}
                            className={cn("h-full rounded-full", cat.color)}
                          />
                        </div>
                      </div>
                    ))}
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
                      {LOW_STOCK.length} alertas
                    </span>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {LOW_STOCK.map((item, i) => (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + (i * 0.05) }}
                          className="px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">{item.category}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-rose-500 dark:text-rose-400">{item.stock} uds</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">Mín: {item.threshold}</p>
                            </div>
                          </div>
                          <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full"
                              style={{ width: `${(item.stock / item.threshold) * 100}%` }}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <PerformanceChart data={WEEKLY_DATA} />
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
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {TOP_PRODUCTS.map((product, i) => (
                      <motion.div
                        key={product.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + (i * 0.05) }}
                        className="px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
                              {i + 1}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white text-sm">{product.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{product.revenue}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{product.sales} ventas</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
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
                  <div className="space-y-4">
                    {RECENT_ACTIVITY.map((act, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 + (i * 0.05) }}
                        className="flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 group-hover:bg-blue-500 transition-colors" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">{act.desc}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{act.time}</p>
                          </div>
                        </div>
                        <span className={cn("text-sm font-bold", act.color)}>{act.amount}</span>
                      </motion.div>
                    ))}
                  </div>
                  <button className="w-full mt-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2">
                    Ver Todo el Historial
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Inventory Preview - Full Width */}
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