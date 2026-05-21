"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { motion, AnimatePresence } from "framer-motion"
import { formatUSD } from "@/lib/currency"
import { cn } from "@/lib/utils"
import { receivableService, Receivable, ReceivableScheduleItem, ScheduleInstallmentInput } from "@/services/businessServices"
import { DollarSign, AlertCircle, CheckCircle2, Clock, Search, ChevronLeft, ChevronRight, Loader2, Banknote, History, Calendar, Plus, Trash2, Save } from "lucide-react"

export default function ReceivablesPage() {
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [summary, setSummary] = useState({ total_pending_usd: 0, total_overdue_usd: 0, total_paid_usd: 0 })
  const pageSize = 20

  // Payment modal
  const [payModal, setPayModal] = useState<{ open: boolean; r: Receivable | null }>({ open: false, r: null })
  const [payAmount, setPayAmount] = useState("")
  const [payMethod, setPayMethod] = useState("cash")
  const [paying, setPaying] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])

  // Schedule modal
  const [schedModal, setSchedModal] = useState<{ open: boolean; r: Receivable | null }>({ open: false, r: null })
  const [scheduleItems, setScheduleItems] = useState<ReceivableScheduleItem[]>([])
  const [schedLoading, setSchedLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editRows, setEditRows] = useState<ScheduleInstallmentInput[]>([])

  const load = async () => {
    setLoading(true)
    try {
      const skip = (page - 1) * pageSize
      const result = await receivableService.getAll({ skip, limit: pageSize, status: statusFilter || undefined })
      setReceivables(result.receivables)
      setTotal(result.total)
      const s = await receivableService.getSummary()
      setSummary(s)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, statusFilter])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const handleOpenPay = async (r: Receivable) => {
    setPayModal({ open: true, r })
    setPayAmount("")
    setPayMethod("cash")
    try {
      const hist = await receivableService.getPayments(r.id)
      setPaymentHistory(hist.payments)
    } catch { setPaymentHistory([]) }
  }

  const handleConfirmPay = async () => {
    const amount = parseFloat(payAmount) || 0
    if (!payModal.r || amount <= 0) return
    setPaying(true)
    try {
      await receivableService.makePayment(payModal.r.id, { amount_bs: amount, payment_method: payMethod })
      setPayModal({ open: false, r: null })
      load()
    } catch (err: any) { alert(err?.message || "Error al procesar el pago") }
    finally { setPaying(false) }
  }

  const handleOpenSchedule = async (r: Receivable) => {
    setSchedModal({ open: true, r })
    setEditing(false)
    setSchedLoading(true)
    try {
      const items = await receivableService.getSchedule(r.id)
      setScheduleItems(items)
    } catch { setScheduleItems([]) }
    finally { setSchedLoading(false) }
  }

  const handleStartEdit = () => {
    if (!schedModal.r) return
    setEditRows([])
    setEditing(true)
  }

  const handleCancelEdit = () => {
    setEditing(false)
  }

  const handleAddRow = () => {
    setEditRows([...editRows, { amount_usd: 0, due_date: "", notes: "" }])
  }

  const handleRemoveRow = (idx: number) => {
    setEditRows(editRows.filter((_, i) => i !== idx))
  }

  const handleRowChange = (idx: number, field: keyof ScheduleInstallmentInput, value: string | number) => {
    const updated = [...editRows]
    updated[idx] = { ...updated[idx], [field]: value }
    setEditRows(updated)
  }

  const handleSetupFromExisting = () => {
    if (!schedModal.r) return
    const items = scheduleItems.map(i => ({
      amount_usd: i.amount_usd,
      due_date: i.due_date,
      notes: i.notes || ""
    }))
    setEditRows(items.length > 0 ? items : [{ amount_usd: schedModal.r.total_usd, due_date: "", notes: "" }])
    setEditing(true)
  }

  const handleSaveSchedule = async () => {
    if (!schedModal.r) return
    const valid = editRows.filter(r => r.amount_usd > 0 && r.due_date)
    if (valid.length === 0) return
    try {
      const result = await receivableService.setupSchedule(schedModal.r.id, { installments: valid })
      setScheduleItems(result)
      setEditing(false)
      load()
    } catch (err: any) { alert(err?.message || "Error al guardar el cronograma") }
  }

  return (
    <main className="flex-1 p-8 overflow-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-blue-500" />
          Cuentas por Cobrar (CxC)
        </h2>
        <p className="text-slate-500 font-medium">Control de créditos indexados al dólar</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-none shadow-lg bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Por Cobrar</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{formatUSD(summary.total_pending_usd)}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vencido</p>
                <p className="text-3xl font-black text-rose-500 mt-1">{formatUSD(summary.total_overdue_usd)}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-rose-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cobrado</p>
                <p className="text-3xl font-black text-emerald-500 mt-1">{formatUSD(summary.total_paid_usd)}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl w-full mb-6">
        <CardHeader className="p-6 border-b border-slate-50 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              {["", "pending", "partially_paid", "paid"].map(s => (
                <Button key={s} variant={statusFilter === s ? "primary" : "outline"} size="sm"
                  onClick={() => { setStatusFilter(s); setPage(1) }}
                  className={cn("rounded-xl text-xs font-bold h-9", statusFilter === s && "bg-blue-600 text-white")}
                >
                  {s === "" ? "Todas" : s === "pending" ? "Pendientes" : s === "partially_paid" ? "Parciales" : "Pagadas"}
                </Button>
              ))}
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{total} CxC</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Total USD</th>
                  <th className="px-6 py-4">Saldo USD</th>
                  <th className="px-6 py-4">Tasa Venta</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 w-44 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                  </td></tr>
                ) : receivables.map((r, i) => (
                  <motion.tr key={r.id} initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{r.customer_name}</span>
                        <span className="text-xs text-slate-400 ml-2">{r.customer_dni}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="font-black text-slate-900 dark:text-white">{formatUSD(r.total_usd)}</span></td>
                    <td className="px-6 py-4"><span className="font-black text-amber-600">{formatUSD(r.remaining_usd)}</span></td>
                    <td className="px-6 py-4"><span className="text-sm text-slate-500">Bs {r.exchange_rate_at_sale.toFixed(2)}</span></td>
                    <td className="px-6 py-4">
                      <span className={cn("text-[10px] font-bold px-2 py-1 rounded-lg uppercase",
                        r.status === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : r.status === "partially_paid" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      )}>
                        {r.status === "paid" ? "Pagada" : r.status === "partially_paid" ? "Parcial" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button onClick={() => handleOpenSchedule(r)} size="sm" variant="outline"
                          className="rounded-xl h-8 text-xs font-bold">
                          <Calendar className="w-3.5 h-3.5 mr-1" /> Cronograma
                        </Button>
                        {r.status !== "paid" && (
                          <Button onClick={() => handleOpenPay(r)} size="sm"
                            className="rounded-xl h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">
                            <Banknote className="w-3.5 h-3.5 mr-1" /> Cobrar
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50 dark:border-slate-800">
              <p className="text-xs text-slate-500">Página {page} de {totalPages}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setPage(page - 1)} disabled={page <= 1}
                  className="h-8 w-8 rounded-lg"><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => setPage(page + 1)} disabled={page >= totalPages}
                  className="h-8 w-8 rounded-lg"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <AnimatePresence>
        {payModal.open && payModal.r && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 border-b dark:border-slate-800">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Cobrar CxC</h3>
                <p className="text-sm text-slate-500">{payModal.r.customer_name} — {formatUSD(payModal.r.remaining_usd)} restantes</p>
              </div>
              <div className="p-8 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Monto a cobrar (Bs)</label>
                  <Input type="number" min={0} step={0.01} value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="0.00"
                    className="rounded-xl text-lg font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Método de pago</label>
                  <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="cash">Efectivo</option>
                    <option value="transfer">Transferencia</option>
                    <option value="pos_debit">Punto de Venta (Débito)</option>
                    <option value="pos_credit">Punto de Venta (Crédito)</option>
                    <option value="pago_movil">Pago Móvil</option>
                    <option value="biopago">Biopago</option>
                  </select>
                </div>

                {/* Payment History */}
                {paymentHistory.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                      <History className="w-3 h-3" /> Historial
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {paymentHistory.map((h: any) => (
                        <div key={h.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                              {h.payment_method === "transfer" ? "Transferencia" : h.payment_method === "cash" ? "Efectivo" : h.payment_method}
                            </span>
                          </div>
                          <span className="text-sm font-black text-emerald-600">{formatUSD(h.amount_usd)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1 rounded-2xl h-12 font-bold"
                    onClick={() => setPayModal({ open: false, r: null })}>Cancelar</Button>
                  <Button className="flex-[2] rounded-2xl h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
                    onClick={handleConfirmPay} disabled={paying || !payAmount || parseFloat(payAmount) <= 0}>
                    {paying ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                    Confirmar Pago
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Schedule Modal */}
      <AnimatePresence>
        {schedModal.open && schedModal.r && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Cronograma de Pagos</h3>
                  <p className="text-sm text-slate-500">{schedModal.r.customer_name} — {formatUSD(schedModal.r.total_usd)} total</p>
                </div>
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>

              <div className="p-6">
                {schedLoading ? (
                  <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" /></div>
                ) : editing ? (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Configurar Cuotas</p>
                    {editRows.map((row, idx) => (
                      <div key={idx} className="flex gap-2 items-start p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                        <div className="flex-1 space-y-1">
                          <div className="flex gap-2">
                            <Input type="number" step={0.01} min={0} placeholder="Monto USD"
                              value={row.amount_usd || ""}
                              onChange={(e) => handleRowChange(idx, "amount_usd", parseFloat(e.target.value) || 0)}
                              className="rounded-lg h-9 text-sm" />
                            <Input type="date"
                              value={row.due_date}
                              onChange={(e) => handleRowChange(idx, "due_date", e.target.value)}
                              className="rounded-lg h-9 text-sm w-40" />
                          </div>
                          <Input placeholder="Nota (opcional)"
                            value={row.notes || ""}
                            onChange={(e) => handleRowChange(idx, "notes", e.target.value)}
                            className="rounded-lg h-8 text-xs" />
                        </div>
                        <Button variant="outline" size="icon" onClick={() => handleRemoveRow(idx)}
                          className="h-9 w-9 rounded-lg shrink-0 text-rose-500 hover:bg-rose-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={handleAddRow}
                      className="rounded-xl text-xs font-bold w-full">
                      <Plus className="w-4 h-4 mr-1" /> Agregar Cuota
                    </Button>
                    <div className="flex gap-3 pt-3">
                      <Button variant="outline" className="flex-1 rounded-2xl h-11 font-bold"
                        onClick={handleCancelEdit}>Cancelar</Button>
                      <Button className="flex-[2] rounded-2xl h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
                        onClick={handleSaveSchedule} disabled={editRows.filter(r => r.amount_usd > 0 && r.due_date).length === 0}>
                        <Save className="w-4 h-4 mr-2" /> Guardar Cronograma
                      </Button>
                    </div>
                  </div>
                ) : scheduleItems.length === 0 ? (
                  <div className="py-10 text-center space-y-4">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-slate-500 font-medium">No hay cronograma configurado</p>
                    <Button onClick={handleStartEdit} className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold">
                      <Plus className="w-4 h-4 mr-2" /> Configurar Cronograma
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {scheduleItems.filter(s => s.status === "paid").length}/{scheduleItems.length} cuotas pagadas
                      </p>
                      <Button variant="outline" size="sm" onClick={handleSetupFromExisting}
                        className="rounded-xl text-xs font-bold h-8">
                        Editar
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {scheduleItems.map((s, idx) => (
                        <div key={s.id}
                          className={cn("p-4 rounded-xl border transition-colors",
                            s.status === "paid" ? "bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                              : s.status === "overdue" ? "bg-rose-50/50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800"
                                : "bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-700"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                              <span className="text-sm font-black text-slate-900 dark:text-white">{formatUSD(s.amount_usd)}</span>
                            </div>
                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                              s.status === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30"
                                : s.status === "overdue" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30"
                            )}>
                              {s.status === "paid" ? "Pagada" : s.status === "overdue" ? "Vencida" : "Pendiente"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                              <Clock className="w-3 h-3 inline mr-1" />
                              Vence: {new Date(s.due_date + "T00:00:00").toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
                            </span>
                            {s.notes && <span className="text-xs text-slate-400 italic">{s.notes}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t dark:border-slate-800">
                <Button variant="outline" className="w-full rounded-2xl h-11 font-bold"
                  onClick={() => { setSchedModal({ open: false, r: null }); setEditing(false) }}>
                  Cerrar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}