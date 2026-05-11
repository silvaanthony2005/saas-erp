"use client";

import { StatCard } from "@/components/shared/StatCard";
import { PerformanceChart } from "@/components/shared/PerformanceChart";
import { InventoryPreview } from "@/components/features/InventoryPreview";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DollarSign, Wallet, Users, ChevronRight } from "lucide-react";
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

const RECENT_ACTIVITY = [
  { type: "Venta", desc: "Factura #1024", time: "Hace 5 min", amount: "+$250", color: "text-emerald-500" },
  { type: "Gasto", desc: "Pago Electricidad", time: "Hace 2h", amount: "-$120", color: "text-rose-500" },
  { type: "Stock", desc: "Alerta: Harina Pan", time: "Hace 3h", amount: "Bajo", color: "text-amber-500" },
  { type: "Nómina", desc: "Recibo Juan Pérez", time: "Ayer", amount: "-$600", color: "text-rose-500" },
];


export default function DashboardPage() {
  return (
    <main className="flex-1 p-8 overflow-auto">
      {/* ... existing header ... */}

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard 
          label="Ventas Totales" 
          value="$12,450.00" 
          icon={DollarSign} 
          trend="+12%" 
          color="bg-blue-500" 
          delay={0}
        />
        <StatCard 
          label="Gastos Operativos" 
          value="$4,200.00" 
          icon={Wallet} 
          trend="-5%" 
          color="bg-violet-500" 
          delay={0.1}
        />
        <StatCard 
          label="Empleados Activos" 
          value="12" 
          icon={Users} 
          trend="+2" 
          color="bg-rose-500" 
          delay={0.2}
        />
      </section>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PerformanceChart data={WEEKLY_DATA} />
          <InventoryPreview />
        </div>

        <Card className="flex flex-col p-8">
          <CardHeader className="p-0 mb-6">
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="space-y-6">
              {RECENT_ACTIVITY.map((act, i) => (
                <div key={i} className="flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-blue-500 transition-colors" />
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{act.desc}</p>
                      <p className="text-xs text-slate-400 font-medium">{act.time}</p>
                    </div>
                  </div>
                  <span className={cn("text-sm font-bold", act.color)}>{act.amount}</span>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 rounded-2xl bg-slate-50 text-slate-900 font-bold hover:bg-slate-100 transition-colors border border-slate-100 flex items-center justify-center gap-2">
              Ver Todo el Historial
              <ChevronRight className="w-4 h-4" />
            </button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}



