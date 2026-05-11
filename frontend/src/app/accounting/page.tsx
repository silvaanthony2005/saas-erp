"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { accountingService, Expense, FinancialSummary } from "@/services/businessServices";
import { Plus, Search, Trash2, DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

const EXPENSE_CATEGORIES = [
  "Alquiler",
  "Servicios",
  "Salarios",
  "Inventario",
  "Mantenimiento",
  "Transporte",
  "Marketing",
  "Otros",
];

export default function AccountingPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "Otros",
    timestamp: new Date().toISOString().split("T")[0],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expensesData, summaryData] = await Promise.all([
        accountingService.getExpenses(),
        accountingService.getSummary(),
      ]);
      setExpenses(expensesData);
      setSummary(summaryData);
    } catch (err) {
      console.error("Error fetching accounting data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await accountingService.createExpense({
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        timestamp: formData.timestamp,
      });
      setFormData({
        description: "",
        amount: "",
        category: "Otros",
        timestamp: new Date().toISOString().split("T")[0],
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error("Error creating expense:", err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await accountingService.deleteExpense(id);
      fetchData();
    } catch (err) {
      console.error("Error deleting expense:", err);
    }
  };

  const filteredExpenses = expenses.filter(
    (exp) =>
      exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <main className="flex-1 p-8 overflow-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Contabilidad</h2>
          <p className="text-slate-500 font-medium">Gestiona tus ingresos, gastos y rentabilidad.</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Gasto
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ingresos Totales</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ${summary ? formatNumber(summary.total_income) : "0"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Gastos Totales</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
              ${summary ? formatNumber(summary.total_expenses) : "0"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Beneficio Neto</p>
            <p className={cn(
              "text-2xl font-black",
              summary && summary.net_profit >= 0 
                ? "text-emerald-600 dark:text-emerald-400" 
                : "text-rose-600 dark:text-rose-400"
            )}>
              ${summary ? formatNumber(summary.net_profit) : "0"}
            </p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl">
            <CardHeader className="p-6 border-b border-slate-50 dark:border-slate-800">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Agregar Nuevo Gasto</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2">
                  <Input
                    placeholder="Descripción del gasto"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    className="bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Monto"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    className="bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 transition-all dark:bg-slate-800 dark:border-slate-700"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={formData.timestamp}
                    onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
                    required
                    className="bg-slate-50 dark:bg-slate-800"
                  />
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl">
        <CardHeader className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-row items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar gastos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredExpenses.length} Gastos en total</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Descripción</th>
                  <th className="px-6 py-4 text-center">Categoría</th>
                  <th className="px-6 py-4 text-right">Monto</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredExpenses.map((expense, i) => (
                  <motion.tr
                    key={expense.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {formatDate(expense.timestamp)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{expense.description}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-rose-600 dark:text-rose-400">
                      ${formatNumber(expense.amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
                {filteredExpenses.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                          <DollarSign className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-medium italic">No se encontraron gastos registrados</p>
                        <Button onClick={() => setShowForm(true)} className="mt-2 bg-emerald-600">
                          Agregar Primer Gasto
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}