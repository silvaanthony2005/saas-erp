"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/format";

interface ChartBarProps {
  label: string;
  value: number;
  max: number;
  delay?: number;
}

export function PerformanceChart({ data }: { data: { day: string, value: number }[] }) {
  const max = Math.max(...data.map(d => d.value)) || 1;

  return (
    <div className="bg-slate-900 dark:bg-slate-900/80 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl h-full flex flex-col border border-white/5">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
        <TrendingUp className="w-5 h-5 text-blue-400" />
        Rendimiento Semanal
      </h3>
      <div className="flex-1 flex items-end gap-3 min-h-[200px] pb-4 relative z-10">
        {data.map((item, i) => (
          <div key={item.day} className="flex-1 flex flex-col items-center gap-3 group cursor-pointer h-full justify-end">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(item.value / max) * 100}%` }}
              transition={{ delay: 0.5 + (i * 0.05), type: "spring", bounce: 0.3 }}
              className="w-full bg-gradient-to-t from-blue-600 to-indigo-400 rounded-t-xl relative group-hover:from-blue-500 group-hover:to-indigo-300 transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)]"
            >
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-1 shadow-xl pointer-events-none whitespace-nowrap">
                ${formatNumber(item.value)}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45" />
              </div>
            </motion.div>
            <span className="text-slate-500 group-hover:text-blue-400 text-[10px] font-black uppercase tracking-widest transition-colors">{item.day}</span>
          </div>
        ))}
      </div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none" />
    </div>
  );
}
