"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { accountingService, Expense, Income, FinancialSummary } from "@/services/businessServices";
import { Plus, Search, Trash2, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Receipt, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

const PAGE_SIZE = 20;

const INCOME_CATEGORIES = [
  "Ventas",
  "Servicios",
  "Inversiones",
  "Otros",
];

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

type TabType = "income" | "expenses";

export default function AccountingPage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("income");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [incomeFormData, setIncomeFormData] = useState({
    description: "",
    amount: "",
    category: "Ventas",
    timestamp: new Date().toISOString().split("T")[0],
  });
  const [expenseFormData, setExpenseFormData] = useState({
    description: "",
    amount: "",
    category: "Otros",
    timestamp: new Date().toISOString().split("T")[0],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [incomesData, expensesData, summaryData] = await Promise.all([
        accountingService.getIncomes(),
        accountingService.getExpenses(),
        accountingService.getSummary(),
      ]);
      setIncomes(incomesData);
      setExpenses(expensesData);
      setSummary(summaryData);
    } catch (err) {
      console.error("Error fetching accounting data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };
    loadData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeTab]);

  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await accountingService.createIncome({
        description: incomeFormData.description,
        amount: parseFloat(incomeFormData.amount),
        category: incomeFormData.category,
        timestamp: incomeFormData.timestamp,
      });
      setIncomeFormData({
        description: "",
        amount: "",
        category: "Ventas",
        timestamp: new Date().toISOString().split("T")[0],
      });
      setShowIncomeForm(false);
      fetchData();
    } catch (err) {
      console.error("Error creating income:", err);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await accountingService.createExpense({
        description: expenseFormData.description,
        amount: parseFloat(expenseFormData.amount),
        category: expenseFormData.category,
        timestamp: expenseFormData.timestamp,
      });
      setExpenseFormData({
        description: "",
        amount: "",
        category: "Otros",
        timestamp: new Date().toISOString().split("T")[0],
      });
      setShowExpenseForm(false);
      fetchData();
    } catch (err) {
      console.error("Error creating expense:", err);
    }
  };

  const handleDeleteIncome = async (id: number) => {
    try {
      await accountingService.deleteIncome(id);
      fetchData();
    } catch (err) {
      console.error("Error deleting income:", err);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await accountingService.deleteExpense(id);
      fetchData();
    } catch (err) {
      console.error("Error deleting expense:", err);
    }
  };

  const filteredIncomes = incomes.filter(
    (inc) =>
      inc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExpenses = expenses.filter(
    (exp) =>
      exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedIncomes = filteredIncomes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const paginatedExpenses = filteredExpenses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = (activeTab === "income" ? filteredIncomes : filteredExpenses).length;
  const totalFilteredPages = Math.max(1, Math.ceil(totalPages / PAGE_SIZE));

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
        <div className="flex gap-3">
          <Button
            onClick={() => setShowIncomeForm(!showIncomeForm)}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20"
          >
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Nuevo Ingreso
          </Button>
          <Button
            onClick={() => setShowExpenseForm(!showExpenseForm)}
            className="rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg shadow-rose-500/20"
          >
            <ArrowDownRight className="w-4 h-4 mr-2" />
            Nuevo Gasto
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-none shadow-xl shadow-emerald-500/5 dark:shadow-none bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">Ingresos</span>
            </div>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
              ${summary ? formatNumber(summary.total_income) : "0"}
            </p>
            <p className="text-[10px] font-medium text-emerald-600/60 mt-1">Total registrado</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-rose-500/5 dark:shadow-none bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-600/60">Gastos</span>
            </div>
            <p className="text-xl font-black text-rose-700 dark:text-rose-300">
              ${summary ? formatNumber(summary.total_expenses) : "0"}
            </p>
            <p className="text-[10px] font-medium text-rose-600/60 mt-1">Total registrado</p>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-none shadow-xl dark:shadow-none",
          summary && summary.net_profit >= 0
            ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/10"
            : "bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/10"
        )}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                summary && summary.net_profit >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"
              )}>
                <Wallet className={cn(
                  "w-5 h-5",
                  summary && summary.net_profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                summary && summary.net_profit >= 0 ? "text-emerald-600/60" : "text-rose-600/60"
              )}>Balance</span>
            </div>
            <p className={cn(
              "text-xl font-black",
              summary && summary.net_profit >= 0
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-rose-700 dark:text-rose-300"
            )}>
              ${summary ? formatNumber(summary.net_profit) : "0"}
            </p>
            <p className={cn(
              "text-[10px] font-medium mt-1",
              summary && summary.net_profit >= 0 ? "text-emerald-600/60" : "text-rose-600/60"
            )}>Beneficio neto</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-blue-500/5 dark:shadow-none bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600/60">Registros</span>
            </div>
            <p className="text-xl font-black text-blue-700 dark:text-blue-300">
              {incomes.length + expenses.length}
            </p>
            <p className="text-[10px] font-medium text-blue-600/60 mt-1">Total entradas</p>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {showIncomeForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <Card className="border-none shadow-xl shadow-emerald-500/10 dark:shadow-none bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="p-5 border-b border-emerald-50 dark:border-emerald-900/20">
                <CardTitle className="text-base font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4" />
                  Agregar Nuevo Ingreso
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <form onSubmit={handleIncomeSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-2">
                    <Input
                      placeholder="Descripción del ingreso"
                      value={incomeFormData.description}
                      onChange={(e) => setIncomeFormData({ ...incomeFormData, description: e.target.value })}
                      required
                      className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/50 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Monto"
                      value={incomeFormData.amount}
                      onChange={(e) => setIncomeFormData({ ...incomeFormData, amount: e.target.value })}
                      required
                      className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/50 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <select
                      value={incomeFormData.category}
                      onChange={(e) => setIncomeFormData({ ...incomeFormData, category: e.target.value })}
                      className="flex h-11 w-full rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all dark:border-emerald-800/50 appearance-none cursor-pointer"
                    >
                      {INCOME_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={incomeFormData.timestamp}
                      onChange={(e) => setIncomeFormData({ ...incomeFormData, timestamp: e.target.value })}
                      required
                      className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/50 focus:ring-emerald-500"
                    />
                    <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExpenseForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <Card className="border-none shadow-xl shadow-rose-500/10 dark:shadow-none bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="p-5 border-b border-rose-50 dark:border-rose-900/20">
                <CardTitle className="text-base font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4" />
                  Agregar Nuevo Gasto
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <form onSubmit={handleExpenseSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-2">
                    <Input
                      placeholder="Descripción del gasto"
                      value={expenseFormData.description}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                      required
                      className="bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-800/50 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Monto"
                      value={expenseFormData.amount}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                      required
                      className="bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-800/50 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <select
                      value={expenseFormData.category}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, category: e.target.value })}
                      className="flex h-11 w-full rounded-xl border border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all dark:border-rose-800/50 appearance-none cursor-pointer"
                    >
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={expenseFormData.timestamp}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, timestamp: e.target.value })}
                      required
                      className="bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-800/50 focus:ring-rose-500"
                    />
                    <Button type="submit" className="bg-rose-500 hover:bg-rose-600">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl w-full">
        <CardHeader className="p-5 border-b border-slate-50 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setActiveTab("income")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  activeTab === "income"
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                <span className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4" />
                  Ingresos
                </span>
              </button>
              <button
                onClick={() => setActiveTab("expenses")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  activeTab === "expenses"
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                <span className="flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4" />
                  Gastos
                </span>
              </button>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === "income" ? "Buscar ingresos..." : "Buscar gastos..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-slate-400 outline-none transition-all"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full">
            <table className="w-full table-fixed">
              <thead>
                <tr className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="px-4 py-4 w-20">Fecha</th>
                  <th className="px-4 py-4 w-[55%]">Descripción</th>
                  <th className="px-4 py-4 w-28 text-center">Categoría</th>
                  <th className="px-4 py-4 text-right">Monto</th>
                  <th className="px-4 py-4 w-12 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {activeTab === "income" ? (
                  <>
                    {paginatedIncomes.map((income, i) => (
                      <motion.tr
                        key={income.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="group hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            {formatDate(income.timestamp)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{income.description}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold uppercase tracking-wider">
                            {income.category}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          +${formatNumber(income.amount)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all opacity-0 group-hover:opacity-100"
                            onClick={() => handleDeleteIncome(income.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                    {filteredIncomes.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="px-5 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                              <ArrowUpRight className="w-7 h-7 text-emerald-300" />
                            </div>
                            <p className="text-slate-400 font-medium italic">No se encontraron ingresos registrados</p>
                            <Button onClick={() => setShowIncomeForm(true)} className="mt-1 bg-emerald-500">
                              Agregar Primer Ingreso
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ) : (
                  <>
                    {paginatedExpenses.map((expense, i) => (
                      <motion.tr
                        key={expense.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="group hover:bg-rose-50/30 dark:hover:bg-rose-900/10 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            {formatDate(expense.timestamp)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{expense.description}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-[9px] font-bold uppercase tracking-wider">
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-black text-rose-600 dark:text-rose-400 text-sm">
                          -${formatNumber(expense.amount)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all opacity-0 group-hover:opacity-100"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                    {filteredExpenses.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="px-5 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center">
                              <ArrowDownRight className="w-7 h-7 text-rose-300" />
                            </div>
                            <p className="text-slate-400 font-medium italic">No se encontraron gastos registrados</p>
                            <Button onClick={() => setShowExpenseForm(true)} className="mt-1 bg-rose-500">
                              Agregar Primer Gasto
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {totalFilteredPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500">
                Página {page} de {totalFilteredPages} ({activeTab === "income" ? filteredIncomes.length : filteredExpenses.length} registros)
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
                  {page} / {totalFilteredPages}
                </span>
                <Button
                  variant="outline" size="icon"
                  onClick={() => setPage(p => Math.min(totalFilteredPages, p + 1))}
                  disabled={page >= totalFilteredPages}
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