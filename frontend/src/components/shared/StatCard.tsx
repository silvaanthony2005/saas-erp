"use client";

import { motion } from "framer-motion";
import { Card } from "../ui/Card";
import { cn } from "@/lib/utils";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  color?: string;
  delay?: number;
}

export function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  color = "bg-blue-500", 
  delay = 0 
}: StatCardProps) {
  const isPositive = trend?.startsWith("+");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="h-full"
    >
      <Card className="flex items-center gap-5 p-6 group hover:border-blue-200 transition-colors h-full">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", color)}>
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">{label}</p>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
            {trend && (
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full flex items-center",
                isPositive ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
              )}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {trend}
              </span>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
