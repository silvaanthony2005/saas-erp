"use client";

import { useState, useEffect } from "react";
import { useAccountsPayable } from "@/hooks/useAccountsPayable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DollarSign, Search, X, AlertCircle, ChevronLeft, ChevronRight, Building2, Calendar, CreditCard, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatBS } from "@/lib/currency";
import { PaymentInput, PaymentSchedule } from "@/services/businessServices";

export default function AccountsPayablePage() {
  const {
    aps, total, page, pageSize, totalPages, statusFilter, summary,
    loading, error, setStatusFilter, setPage, refresh, loadSummary,
    makePayment, getPayments
  } = useAccountsPayable();

  const [isPaymentModal, setIsPaymentModal] = useState(false);
  const [selectedApId, setSelectedApId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPayments, setShowPayments] = useState<{ apId: number; schedules: PaymentSchedule[] } | null>(null);

  const handleOpenPayment = (ap: typeof aps[0]) => {
    setSelectedApId(ap.id);
    setPaymentAmount(ap.remaining_balance_bs);
    setPaymentMethod("Cash");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentNotes("");
    setIsPaymentModal(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedApId || paymentAmount <= 0) return;
    setSaving(true);
    try {
      await makePayment({
        accounts_payable_id: selectedApId,
        amount_bs: paymentAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        notes: paymentNotes || undefined,
      });
      setIsPaymentModal(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleViewPayments = async (apId: number) => {
    try {
      const schedules = await getPayments(apId);
      setShowPayments({ apId, schedules });
    } catch (err) { console.error(err); }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
      partially_paid: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
      paid: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
      overdue: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
      cancelled: "bg-slate-100 dark:bg-slate-800 text-slate-400",
    };
    const labels: Record<string, string> = {
      pending: "Pendiente", partially_paid: "Parcial",
      paid: "Pagada", overdue: "Vencida", cancelled: "Anulada",
    };
    return (
      <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", styles[status] || "")}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <main className="flex-1 p-8 overflow-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Cuentas por Pagar</h2>
          <p className="text-slate-500 font-medium">Gestión de deudas con proveedores y programación de pagos.</p>
        </div>
      </header>

      {error && (
        <div className="mb-4 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <span className="text-rose-700 dark:text-rose-400 text-sm">{error}</span>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-none shadow-lg bg-white/80 dark:bg-slate-900/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-sm font-medium text-slate-500">Total Pendiente</p>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{formatBS(summary.total_pending_bs)}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg bg-white/80 dark:bg-slate-900/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                </div>
                <p className="text-sm font-medium text-slate-500">Vencido</p>
              </div>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{formatBS(summary.total_overdue_bs)}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg bg-white/80 dark:bg-slate-900/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-slate-500">Total Pagado</p>
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatBS(summary.total_paid_bs)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl w-full">
        <CardHeader className="p-6 border-b border-slate-50 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <select value={statusFilter || ""} onChange={(e) => { setStatusFilter(e.target.value || undefined); setPage(1); }}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="partially_paid">Parcial</option>
              <option value="paid">Pagada</option>
              <option value="overdue">Vencida</option>
            </select>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">{total} Cuentas</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="px-6 py-4">Factura</th>
                  <th className="px-6 py-4">Proveedor</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-right">Saldo</th>
                  <th className="px-6 py-4 text-center">Vencimiento</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {loading && aps.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-slate-400 font-medium">Cargando cuentas...</p>
                    </div>
                  </td></tr>
                ) : aps.map((ap, i) => (
                  <motion.tr key={ap.id} initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{ap.invoice_number || `#${ap.purchase_invoice_id}`}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
                        <Building2 className="w-3 h-3" /> {ap.supplier_name || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(ap.status)}</td>
                    <td className="px-6 py-4 text-right font-bold text-sm">{formatBS(ap.total_amount_bs)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn("font-bold text-sm", ap.remaining_balance_bs > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600")}>
                        {formatBS(ap.remaining_balance_bs)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {ap.due_date ? new Date(ap.due_date).toLocaleDateString("es-VE") : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {ap.remaining_balance_bs > 0 && (
                          <Button onClick={() => handleOpenPayment(ap)} variant="success" size="sm"
                            className="rounded-lg text-xs font-bold">
                            <CreditCard className="w-3 h-3 mr-1" /> Pagar
                          </Button>
                        )}
                        <Button onClick={() => handleViewPayments(ap.id)} variant="outline" size="sm"
                          className="rounded-lg text-xs">
                          Historial
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {aps.length === 0 && !loading && (
                  <tr><td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <DollarSign className="w-12 h-12 text-slate-300" />
                      <p className="text-slate-400 font-medium italic">No hay cuentas por pagar</p>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50 dark:border-slate-800">
              <p className="text-xs text-slate-500">Página {page} de {totalPages}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setPage(page - 1)} disabled={page <= 1} className="h-8 w-8 rounded-lg"><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="h-8 w-8 rounded-lg"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {isPaymentModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setIsPaymentModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Registrar Pago</h3>
                  <Button variant="ghost" size="icon" onClick={() => setIsPaymentModal(false)}><X className="w-5 h-5" /></Button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monto a Pagar (Bs)</label>
                    <Input type="number" step="0.01" min="0" value={paymentAmount}
                      onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Método de Pago</label>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Cash">Efectivo</option>
                      <option value="Transfer">Transferencia</option>
                      <option value="Card">Tarjeta</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha de Pago</label>
                    <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas</label>
                    <textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)}
                      className="w-full h-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Referencia, número de transacción..." />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsPaymentModal(false)} className="flex-1 rounded-xl">Cancelar</Button>
                    <Button onClick={handleSubmitPayment} disabled={saving || paymentAmount <= 0}
                      className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700">
                      {saving ? "Procesando..." : "Confirmar Pago"}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPayments && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setShowPayments(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Historial de Pagos</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowPayments(null)}><X className="w-5 h-5" /></Button>
                </div>
                <div className="p-6">
                  {showPayments.schedules.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">Sin pagos registrados</p>
                  ) : (
                    <div className="space-y-3">
                      {showPayments.schedules.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <div>
                            <p className="font-bold text-sm">{formatBS(s.amount_bs)}</p>
                            <p className="text-xs text-slate-400">
                              {s.payment_date ? new Date(s.payment_date).toLocaleDateString("es-VE") : "—"} · {s.payment_method}
                            </p>
                            {s.notes && <p className="text-xs text-slate-500 mt-1">{s.notes}</p>}
                          </div>
                          <span className={cn("px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                            s.is_paid ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : "bg-amber-100 text-amber-600")}>
                            {s.is_paid ? "Pagado" : "Pendiente"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
