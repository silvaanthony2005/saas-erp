"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useInventory } from "@/hooks/useInventory"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ShoppingCart, Search, Trash2, Plus, Minus, CreditCard, Banknote, AlertTriangle, CheckCircle2, Loader2, RefreshCcw, Info, Smartphone, QrCode, DollarSign, PiggyBank, User, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatNumber } from "@/lib/format"
import { formatBS, formatUSD } from "@/lib/currency"
import { useExchangeRate } from "@/hooks/useExchangeRate"
import { cn } from "@/lib/utils"
import { InventoryItem, salesService, inventoryService, customerService, Customer } from "@/services/businessServices"

interface CartItem extends InventoryItem {
  quantity: number
}

interface PaymentEntry {
  id: number
  method: string
  amount_bs: number
  amount_usd: number | null
  reference: string
}

interface Toast {
  id: number
  message: string
  type: "warning" | "error" | "success" | "info"
}

const PAYMENT_METHODS = [
  { value: "pos_debit", label: "Punto de Venta (Débito)", icon: CreditCard },
  { value: "pos_credit", label: "Punto de Venta (Crédito)", icon: CreditCard },
  { value: "pago_movil", label: "Pago Móvil", icon: Smartphone },
  { value: "biopago", label: "Biopago", icon: QrCode },
  { value: "cash_usd", label: "Efectivo USD", icon: DollarSign },
  { value: "cash_bs", label: "Efectivo Bs", icon: Banknote },
]

export default function POSPage() {
  const { items, total: totalItems, refreshInventory: refresh } = useInventory()
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState("")
  const [toasts, setToasts] = useState<Toast[]>([])
  const [shakeProductId, setShakeProductId] = useState<number | null>(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const [loadingAll, setLoadingAll] = useState(false)
  const { rate: currentExchangeRate } = useExchangeRate()
  const toastIdRef = useRef(0)

  // Cliente
  const [dni, setDni] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [searchingCustomer, setSearchingCustomer] = useState(false)

  // Split payment
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [payments, setPayments] = useState<PaymentEntry[]>([])
  const paymentIdRef = useRef(0)

  // Estado para todos los productos
  const [allProducts, setAllProducts] = useState<InventoryItem[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const loadMoreProducts = useCallback(async (reset = false) => {
    if (loadingAll || (!hasMore && !reset)) return
    setLoadingAll(true)
    const newPage = reset ? 0 : page
    const limit = 100
    const skip = newPage * limit
    try {
      const result = await inventoryService.getAll({ skip, limit })
      const newProducts = result.products || []
      if (reset) setAllProducts(newProducts)
      else setAllProducts(prev => [...prev, ...newProducts])
      setHasMore(newProducts.length === limit)
      setPage(newPage + 1)
    } catch (err) {
      showToast("Error al cargar productos", "error")
    } finally { setLoadingAll(false) }
  }, [page, loadingAll, hasMore])

  useEffect(() => { loadMoreProducts(true) }, [])

  const showToast = (message: string, type: Toast["type"] = "warning") => {
    toastIdRef.current += 1
    const id = toastIdRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  const getCartQuantity = (productId: number) => cart.find(i => i.id === productId)?.quantity || 0
  const canAddToCart = (product: CartItem) => (getCartQuantity(product.id) + 1) <= product.stock_quantity

  const addToCart = (product: InventoryItem) => {
    const existing = cart.find(i => i.id === product.id)
    if (existing) {
      if (!canAddToCart({ ...product, quantity: existing.quantity + 1 })) {
        setShakeProductId(product.id)
        showToast(`Stock insuficiente: solo quedan ${product.stock_quantity} unidades`, "error")
        setTimeout(() => setShakeProductId(null), 500)
        return
      }
      setCart(cart.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const removeFromCart = (id: number) => setCart(cart.filter(i => i.id !== id))

  const updateQuantity = (id: number, delta: number) => {
    const item = cart.find(i => i.id === id)
    if (!item) return
    const newQty = item.quantity + delta
    if (newQty > item.stock_quantity) {
      setShakeProductId(id)
      showToast(`Stock insuficiente: solo quedan ${item.stock_quantity} unidades`, "error")
      setTimeout(() => setShakeProductId(null), 500)
      return
    }
    if (newQty < 1) return
    setCart(cart.map(i => i.id === id ? { ...i, quantity: newQty } : i))
  }

  const getPriceBs = (item: InventoryItem) =>
    item.sale_price_usd ? item.sale_price_usd * currentExchangeRate : item.sale_price_bs

  const total_bs = useMemo(() =>
    cart.reduce((acc, item) => acc + (getPriceBs(item) * item.quantity), 0),
    [cart, currentExchangeRate]
  )

  const subtotal_bs = useMemo(() => total_bs / 1.16, [total_bs])
  const iva_bs = useMemo(() => total_bs - subtotal_bs, [total_bs, subtotal_bs])

  const addPaymentEntry = (method: string) => {
    paymentIdRef.current += 1
    setPayments(prev => [...prev, {
      id: paymentIdRef.current, method, amount_bs: 0,
      amount_usd: method === "cash_usd" ? 0 : null, reference: ""
    }])
  }

  const updatePayment = (id: number, field: string, value: any) => {
    setPayments(prev => prev.map(p => {
      if (p.id !== id) return p
      const updated = { ...p, [field]: value }
      if (field === "amount_usd" && p.method === "cash_usd") {
        updated.amount_bs = (value || 0) * currentExchangeRate
      }
      return updated
    }))
  }

  const removePayment = (id: number) => setPayments(prev => prev.filter(p => p.id !== id))

  const covered_bs = useMemo(() =>
    payments.reduce((s, p) => s + (p.amount_bs || 0), 0),
    [payments]
  )
  const remaining_bs = useMemo(() => Math.max(0, total_bs - covered_bs), [total_bs, covered_bs])
  const isFullyCovered = useMemo(() => Math.abs(covered_bs - total_bs) < 0.02 && covered_bs > 0, [covered_bs, total_bs])

  const total_usd = currentExchangeRate > 0 ? total_bs / currentExchangeRate : 0

  const handleDniSearch = async (e?: React.KeyboardEvent) => {
    if ((!e || e.key === "Enter") && dni) {
      setSearchingCustomer(true)
      try {
        const customer = await customerService.getByDni(dni)
        setSelectedCustomer(customer)
        showToast(`Cliente: ${customer.first_name} ${customer.last_name}`, "success")
        return true
      } catch (err: any) {
        if (err?.status === 404) { showToast("Cliente no encontrado. Regístrelo en Clientes.", "error"); return false }
        else { showToast("Error al buscar cliente", "error"); return false }
      } finally { setSearchingCustomer(false) }
    }
    return false
  }

  const handleOpenPayment = async () => {
    if (cart.length === 0) { showToast("El carrito está vacío", "warning"); return }
    if (!selectedCustomer) {
      if (dni) {
        const found = await handleDniSearch()
        if (!found) return
        showToast("Cliente identificado. Presione Cobrar de nuevo.", "info")
        return
      }
      showToast("Debe identificar un cliente (cédula)", "warning")
      return
    }
    setPayments([])
    addPaymentEntry("cash_bs")
    setShowPaymentModal(true)
  }

  const handleCreditSale = async () => {
    if (!selectedCustomer) { showToast("Debe identificar un cliente", "error"); return }
    setCheckingOut(true)
    try {
      await salesService.createSale({
        customer_id: selectedCustomer.id,
        is_credit: true,
        details: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price_bs: getPriceBs(item),
          unit_price_usd: item.sale_price_usd || (getPriceBs(item) / currentExchangeRate),
        }))
      })
      showToast(`Venta a crédito: ${formatUSD(total_usd)}`, "success")
      setCart([])
      setSelectedCustomer(null)
      setDni("")
      setShowPaymentModal(false)
      loadMoreProducts(true)
      refresh()
    } catch (err: any) { showToast(err?.message || "Error al procesar la venta", "error") }
    finally { setCheckingOut(false) }
  }

  const handleConfirmPayment = async () => {
    if (!isFullyCovered) { showToast("Los pagos no cubren el total", "warning"); return }
    setCheckingOut(true)
    try {
      await salesService.createSale({
        customer_id: selectedCustomer?.id,
        payments: payments.map(p => ({
          payment_method: p.method,
          amount_bs: p.amount_bs,
          amount_usd: p.amount_usd || undefined,
          reference_number: p.reference || undefined,
        })),
        details: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price_bs: getPriceBs(item),
          unit_price_usd: item.sale_price_usd || (getPriceBs(item) / currentExchangeRate),
        }))
      })
      const count = cart.reduce((s, item) => s + item.quantity, 0)
      showToast(`Venta completada: ${count} artículos por ${formatUSD(total_usd)}`, "success")
      setCart([])
      setSelectedCustomer(null)
      setDni("")
      setShowPaymentModal(false)
      loadMoreProducts(true)
      refresh()
    } catch (err: any) { showToast(err?.message || "Error al procesar la venta", "error") }
    finally { setCheckingOut(false) }
  }

  const filteredItems = (allProducts.length > 0 ? allProducts : items).filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="flex-1 flex overflow-hidden bg-slate-50 dark:bg-slate-950 p-6 gap-6">
      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div key={toast.id} initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={cn("flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border",
                toast.type === "error" ? "bg-rose-50 dark:bg-rose-900/30 border-rose-200 text-rose-700 dark:text-rose-300"
                  : toast.type === "success" ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 text-emerald-700 dark:text-emerald-300"
                    : toast.type === "info" ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 text-blue-700 dark:text-blue-300"
                      : "bg-amber-50 dark:bg-amber-900/30 border-amber-200 text-amber-700 dark:text-amber-300"
              )}
            >
              {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : toast.type === "info" ? <Info className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Product Selection */}
      <div className="flex-1 flex flex-col gap-6">
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-emerald-500" />
              Punto de Venta (POS)
            </h2>
            <Button variant="outline" size="sm" onClick={() => loadMoreProducts(true)}
              className="rounded-xl flex items-center gap-2" disabled={loadingAll}>
              <RefreshCcw className={cn("w-4 h-4", loadingAll && "animate-spin")} />
              {loadingAll ? "Cargando..." : "Actualizar"}
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="Escanear SKU o buscar producto..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border-none shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-lg font-medium" />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
          {loadingAll && allProducts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <p className="text-slate-500 font-medium">Cargando productos...</p>
            </div>
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <motion.button key={item.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                animate={shakeProductId === item.id ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.5 }}
                onClick={() => addToCart(item)}
                className={cn("p-4 rounded-3xl bg-white dark:bg-slate-900 border text-left shadow-sm hover:shadow-xl transition-all group",
                  shakeProductId === item.id ? "border-rose-500 ring-2 ring-rose-500/50" : "border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-900",
                  item.stock_quantity === 0 && "opacity-50 cursor-not-allowed"
                )} disabled={item.stock_quantity === 0}
              >
                <div className="w-full h-32 rounded-2xl bg-slate-50 dark:bg-slate-800 mb-4 flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors">
                  <span className="text-4xl font-bold text-slate-300 dark:text-slate-600 group-hover:text-emerald-500">{item.name[0]}</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{item.name}</h4>
                <p className="text-xs text-slate-400 font-medium mb-3 uppercase tracking-widest">{item.sku}</p>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">{formatUSD(item.sale_price_usd)}</span>
                  <span className={cn("text-[10px] font-bold px-2 py-1 rounded-lg",
                    item.stock_quantity > 0 ? "bg-slate-100 dark:bg-slate-800 text-slate-500" : "bg-rose-100 text-rose-500"
                  )}>{item.stock_quantity} uds</span>
                </div>
              </motion.button>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium italic">No se encontraron productos</p>
            </div>
          )}
          {hasMore && !search && (
            <div className="col-span-full py-6 flex justify-center">
              <Button variant="outline" onClick={() => loadMoreProducts()} disabled={loadingAll}
                className="rounded-2xl px-8 py-6 border-2 border-emerald-500/20 text-emerald-600 hover:bg-emerald-50 font-bold">
                {loadingAll ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                Cargar más productos
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Cart + Payment */}
      <Card className="w-96 flex flex-col border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-slate-900 text-white p-8">
          <CardTitle className="text-xl flex items-center justify-between mb-4">
            Carrito
            <span className="bg-emerald-500 text-[10px] px-2 py-1 rounded-full">{cart.length}</span>
          </CardTitle>
          <div className="space-y-3">
            <div className="relative">
              <User className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                selectedCustomer ? "text-emerald-400" : "text-slate-500"
              )} />
              <input type="text" placeholder="Cédula del cliente — Enter para buscar"
                value={dni} onChange={(e) => { setDni(e.target.value); if (selectedCustomer) setSelectedCustomer(null) }}
                onKeyDown={handleDniSearch}
                className="w-full bg-slate-800 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
              {searchingCustomer && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-emerald-500" />}
            </div>
            <AnimatePresence>
              {selectedCustomer && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-emerald-500/60 leading-none mb-1">Cliente</span>
                    <span className="text-xs font-bold text-emerald-400">{selectedCustomer.first_name} {selectedCustomer.last_name}</span>
                    {selectedCustomer.category === "exclusive" && (
                      <>
                        <span className="text-[10px] font-bold text-amber-400 mt-1">✦ Exclusivo</span>
                        <span className="text-[10px] font-bold text-emerald-400/70 mt-0.5">
                          Crédito: {formatUSD(selectedCustomer.credit_limit_usd || 0)}
                        </span>
                      </>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-500 hover:bg-emerald-500/20"
                    onClick={() => { setSelectedCustomer(null); setDni("") }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-slate-400 dark:text-slate-500">{item.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-black">{formatBS(getPriceBs(item) * item.quantity)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md"
                      onClick={() => updateQuantity(item.id, -1)} disabled={item.quantity <= 1}>
                      <Minus className={cn("w-3 h-3", item.quantity <= 1 && "text-slate-300")} />
                    </Button>
                    <span className={cn("text-sm font-bold w-4 text-center", item.quantity >= item.stock_quantity && "text-rose-500")}>
                      {item.quantity}
                    </span>
                    <Button variant="ghost" size="icon" className={cn("h-6 w-6 rounded-md",
                      item.quantity >= item.stock_quantity && "text-rose-500")}
                      onClick={() => updateQuantity(item.id, 1)} disabled={item.quantity >= item.stock_quantity}>
                      <Plus className={cn("w-3 h-3", item.quantity >= item.stock_quantity && "text-rose-500")} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50"
                      onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 italic">
                <ShoppingCart className="w-12 h-12 opacity-20" />
                <p>El carrito está vacío</p>
              </div>
            )}
          </div>
          <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Subtotal</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{formatBS(subtotal_bs)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">IVA (16%)</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{formatBS(iva_bs)}</span>
              </div>
              <div className="flex justify-end items-end pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{formatBS(total_bs)}</span>
                  <span className="text-sm font-bold text-slate-500">{formatUSD(total_usd)}</span>
                </div>
              </div>
            </div>
            {selectedCustomer?.category === "exclusive" ? (
              <div className="flex gap-3">
                <Button className="flex-1 rounded-2xl h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                  onClick={handleOpenPayment} disabled={cart.length === 0 || checkingOut}>
                  <Banknote className="w-5 h-5 mr-2" />
                  Cobrar
                </Button>
                <Button className="flex-1 rounded-2xl h-14 bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg disabled:opacity-50 shadow-lg shadow-amber-500/20"
                  onClick={handleCreditSale} disabled={cart.length === 0 || checkingOut}>
                  {checkingOut ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <PiggyBank className="w-5 h-5 mr-2" />}
                  Venta a Crédito
                </Button>
              </div>
            ) : (
              <Button className="w-full rounded-2xl h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                onClick={handleOpenPayment} disabled={cart.length === 0 || checkingOut}>
                {checkingOut ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Banknote className="w-5 h-5 mr-2" />}
                Cobrar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal Split Payment */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8 border-b dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Split Payment</h3>
                  <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setShowPaymentModal(false)}>
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Total a cobrar</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{formatBS(total_bs)}</p>
                    <p className="text-sm font-bold text-slate-500">{formatUSD(total_usd)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 font-medium">Cubierto</p>
                    <p className={cn("text-2xl font-black", isFullyCovered ? "text-emerald-500" : "text-amber-500")}>
                      {formatBS(covered_bs)}
                    </p>
                  </div>
                </div>
                {/* Barra de progreso */}
                <div className="mt-3 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-300",
                    isFullyCovered ? "bg-emerald-500" : "bg-amber-400"
                  )} style={{ width: `${Math.min(100, (covered_bs / total_bs) * 100)}%` }} />
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Botones de método de pago */}
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map(m => {
                    const Icon = m.icon
                    return (
                      <Button key={m.value} variant="outline" size="sm"
                        onClick={() => addPaymentEntry(m.value)}
                        className="rounded-xl text-xs font-bold flex items-center gap-1.5 h-9">
                        <Icon className="w-3.5 h-3.5" /> {m.label}
                      </Button>
                    )
                  })}
                </div>

                {payments.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 italic">Agrega uno o más métodos de pago</div>
                ) : (
                  payments.map((pmt, idx) => {
                    const methodInfo = PAYMENT_METHODS.find(m => m.value === pmt.method)
                    const Icon = methodInfo?.icon || Banknote
                    return (
                      <motion.div key={pmt.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-slate-500" />
                            <select value={pmt.method}
                              onChange={(e) => setPayments(prev => prev.map(p => p.id === pmt.id ? { ...p, method: e.target.value, amount_usd: e.target.value === "cash_usd" ? (p.amount_usd || 0) : null } : p))}
                              className="text-sm font-bold bg-transparent border-none outline-none text-slate-700 dark:text-slate-300"
                            >
                              {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500 rounded-lg"
                            onClick={() => removePayment(pmt.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        {pmt.method === "cash_usd" ? (
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monto USD</label>
                              <Input type="number" min={0} step={0.01} value={pmt.amount_usd || ""}
                                onChange={(e) => updatePayment(pmt.id, "amount_usd", parseFloat(e.target.value) || 0)}
                                className="rounded-xl" />
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Equiv. Bs</label>
                              <Input type="number" value={pmt.amount_bs} disabled className="rounded-xl bg-slate-100 dark:bg-slate-700" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monto Bs</label>
                              <Input type="number" min={0} step={0.01} value={pmt.amount_bs || ""}
                                onChange={(e) => updatePayment(pmt.id, "amount_bs", parseFloat(e.target.value) || 0)}
                                className="rounded-xl" />
                            </div>
                          </div>
                        )}

                        {pmt.method === "pago_movil" && (
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nro. Referencia</label>
                            <Input type="text" value={pmt.reference}
                              onChange={(e) => updatePayment(pmt.id, "reference", e.target.value)}
                              placeholder="Ingrese el número de referencia" className="rounded-xl" />
                          </div>
                        )}
                      </motion.div>
                    )
                  })
                )}

                {/* Saldo restante */}
                {remaining_bs > 0 && payments.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">Saldo pendiente</span>
                    <span className="text-lg font-black text-amber-700 dark:text-amber-400">{formatBS(remaining_bs)}</span>
                  </div>
                )}
              </div>

              <div className="p-6 border-t dark:border-slate-800 space-y-3">
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-2xl h-12 font-bold"
                    onClick={() => setShowPaymentModal(false)}>Cancelar</Button>
                  <Button className="flex-[2] rounded-2xl h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base disabled:opacity-50 shadow-lg"
                    onClick={handleConfirmPayment} disabled={!isFullyCovered || checkingOut}>
                    {checkingOut ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                    Confirmar Pago {isFullyCovered && `(${payments.length} método${payments.length > 1 ? "s" : ""})`}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
