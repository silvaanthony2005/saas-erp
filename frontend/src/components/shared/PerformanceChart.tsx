"use client";

import { motion } from "framer-motion";
import { TrendingUp, BarChart3 } from "lucide-react";
import { formatNumber } from "@/lib/format";

export function PerformanceChart({ data }: { data: { day: string, value: number }[] }) {
  const max = Math.max(...data.map(d => d.value)) || 1;
  const hasData = data.some(d => d.value > 0);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl border border-white/5 dark:shadow-none">
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Rendimiento Semanal
        </h3>
        {hasData && (
          <span className="text-sm font-bold text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-xl">
            Total: ${formatNumber(total)}
          </span>
        )}
      </div>
      <div className="relative z-10">
        {hasData ? (
          <div className="flex items-end gap-3 h-[380px]">
            {data.map((item, i) => {
              const pct = (item.value / max) * 100;
              return (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-3 group cursor-pointer self-stretch justify-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${pct}%` }}
                    transition={{ delay: 0.5 + (i * 0.05), type: "spring", bounce: 0.3 }}
                    className="w-full bg-gradient-to-t from-blue-600 to-indigo-400 rounded-t-xl relative group-hover:from-blue-500 group-hover:to-indigo-300 transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                    style={{ minHeight: pct > 0 ? "4px" : "0px" }}
                  >
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-1 shadow-xl pointer-events-none whitespace-nowrap">
                      ${formatNumber(item.value)}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45" />
                    </div>
                  </motion.div>
                  <span className="text-slate-500 group-hover:text-blue-400 text-[10px] font-black uppercase tracking-widest transition-colors">{item.day}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 text-slate-500 h-[380px]">
            <BarChart3 className="w-12 h-12 opacity-30" />
            <p className="text-sm font-medium">Realiza tu primera venta para ver el rendimiento</p>
            <p className="text-xs opacity-50">Los datos se actualizan automáticamente</p>
          </div>
        )}
      </div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none" />
    </div>
  );
}
