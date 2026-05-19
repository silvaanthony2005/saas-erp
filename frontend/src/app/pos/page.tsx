"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useInventory } from "@/hooks/useInventory"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { ShoppingCart, Search, Trash2, Plus, Minus, CreditCard, Banknote, AlertTriangle, CheckCircle2, Loader2, RefreshCcw, Info } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatNumber } from "@/lib/format"
import { formatBS, formatUSD } from "@/lib/currency"
import { useExchangeRate } from "@/hooks/useExchangeRate"
import { cn } from "@/lib/utils"
import { InventoryItem, salesService, inventoryService, customerService, Customer } from "@/services/businessServices"
import { User, UserPlus } from "lucide-react"

interface CartItem extends InventoryItem {
  quantity: number
}

interface Toast {
  id: number
  message: string
  type: "warning" | "error" | "success" | "info"
}

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
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [customerForm, setCustomerForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: ""
  })

  // Estado para todos los productos (carga masiva para búsqueda global en POS)
  const [allProducts, setAllProducts] = useState<InventoryItem[]>([])
  
  // El backend permite un máximo de 100 productos por petición
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
      
      if (reset) {
        setAllProducts(newProducts)
      } else {
        setAllProducts(prev => [...prev, ...newProducts])
      }
      
      setHasMore(newProducts.length === limit)
      setPage(newPage + 1)
    } catch (err) {
      console.error("Error loading products for POS:", err)
      showToast("Error al cargar productos", "error")
    } finally {
      setLoadingAll(false)
    }
  }, [page, loadingAll, hasMore])

  useEffect(() => {
    loadMoreProducts(true)
  }, []) // Solo al montar

  const showToast = (message: string, type: "warning" | "error" | "success" | "info" = "warning") => {
    toastIdRef.current += 1
    const id = toastIdRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  const getCartQuantity = (productId: number): number => {
    const item = cart.find(i => i.id === productId)
    return item ? item.quantity : 0
  }

  const canAddToCart = (product: CartItem): boolean => {
    const currentQty = getCartQuantity(product.id)
    return (currentQty + 1) <= product.stock_quantity
  }

  const addToCart = (product: InventoryItem) => {
    const cartProduct: CartItem = { ...product, quantity: 1 }
    const existing = cart.find(i => i.id === product.id)
    
    if (!canAddToCart(cartProduct)) {
      setShakeProductId(product.id)
      showToast(`Stock insuficiente: solo quedan ${product.stock_quantity} unidades`, "error")
      setTimeout(() => setShakeProductId(null), 500)
      return
    }

    if (existing) {
      setCart(cart.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setCart([...cart, cartProduct])
    }
  }

  const removeFromCart = (id: number) => {
    setCart(cart.filter(i => i.id !== id))
  }

  const canUpdateQuantity = (item: CartItem, delta: number): boolean => {
    const newQty = item.quantity + delta
    if (newQty < 1) return true
    return newQty <= item.stock_quantity
  }

  const updateQuantity = (id: number, delta: number) => {
    const cartItem = cart.find(i => i.id === id)
    if (!cartItem) return
    
    if (!canUpdateQuantity(cartItem, delta)) {
      setShakeProductId(id)
      showToast(`Stock insuficiente: solo quedan ${cartItem.stock_quantity} unidades`, "error")
      setTimeout(() => setShakeProductId(null), 500)
      return
    }

    setCart(cart.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta)
        return { ...i, quantity: newQty }
      }
      return i
    }))
  }

  const total_bs = cart.reduce((acc, item) => acc + (item.sale_price_bs * item.quantity), 0)

  const handleDniSearch = async (e?: React.KeyboardEvent) => {
    if ((!e || e.key === "Enter") && dni) {
      setSearchingCustomer(true)
      try {
        const customer = await customerService.getByDni(dni)
        if (customer) {
          setSelectedCustomer(customer)
          showToast(`Cliente: ${customer.first_name} ${customer.last_name}`, "success")
          return true
        }
      } catch (err: any) {
        if (err?.status === 404) {
          setShowCustomerModal(true)
          return false
        } else {
          showToast("Error al buscar cliente", "error")
          return false
        }
      } finally {
        setSearchingCustomer(false)
      }
    }
    return false
  }

  const handleCreateCustomer = async () => {
    if (!customerForm.first_name || !customerForm.last_name) {
      showToast("Nombre y apellido son obligatorios", "warning")
      return
    }
    try {
      const newCustomer = await customerService.create({
        dni,
        ...customerForm
      })
      setSelectedCustomer(newCustomer)
      setShowCustomerModal(false)
      showToast("Cliente registrado correctamente", "success")
      setCustomerForm({ first_name: "", last_name: "", phone: "", address: "" })
    } catch (err: any) {
      console.error("Error creating customer:", err?.message || err)
      showToast(err?.status === 400 ? "El cliente ya existe" : "Error al registrar cliente", "error")
    }
  }

  const handleCheckout = async (method: string) => {
    if (cart.length === 0) {
      showToast("El carrito está vacío", "warning")
      return
    }
    
    // Si no hay cliente seleccionado pero hay algo en el campo DNI, intentar buscarlo/crearlo primero
    if (!selectedCustomer && dni) {
      const found = await handleDniSearch()
      if (!found) return // Aborta para que el usuario complete el registro en el modal si saltó 404
      
      // Si se encontró al cliente ahora (handleDniSearch actualiza selectedCustomer y retorna true),
      // NO llamamos a handleCheckout recursivamente porque handleDniSearch tarda un tick en actualizar el estado.
      // Mejor avisar al usuario que ya puede cobrar.
      showToast("Cliente identificado. Presione Cobrar de nuevo.", "info")
      return
    }

    if (!selectedCustomer) {
      showToast("Debe identificar un cliente (Cédula) antes de vender", "error")
      return
    }

    setCheckingOut(true)
    try {
      await salesService.createSale({
        customer_id: selectedCustomer.id,
        payment_method: method,
        details: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price_bs: item.sale_price_bs
        }))
      })
      const count = cart.reduce((sum, item) => sum + item.quantity, 0)
      showToast(`Venta completada: ${count} artículos por ${formatUSD(total_bs / currentExchangeRate)}`, "success")
      setCart([])
      setSelectedCustomer(null)
      setDni("")
      loadMoreProducts(true)
      refresh()
    } catch (err: any) {
      showToast(err?.detail || "Error al procesar la venta", "error")
    } finally {
      setCheckingOut(false)
    }
  }

  const filteredItems = (allProducts.length > 0 ? allProducts : items).filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.sku.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="flex-1 flex overflow-hidden bg-slate-50 dark:bg-slate-950 p-6 gap-6">
      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border",
                toast.type === "error" 
                  ? "bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
                  : toast.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                  : toast.type === "info"
                  ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                  : "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
              )}
            >
              {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : toast.type === "info" ? <Info className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Product Selection Section */}
      <div className="flex-1 flex flex-col gap-6">
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-emerald-500" />
              Punto de Venta (POS)
            </h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadMoreProducts(true)}
              className="rounded-xl flex items-center gap-2"
              disabled={loadingAll}
            >
              <RefreshCcw className={cn("w-4 h-4", loadingAll && "animate-spin")} />
              {loadingAll ? "Cargando..." : "Actualizar"}
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Escanear SKU o buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border-none shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-lg font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6 custom-scrollbar">
          {loadingAll && allProducts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <p className="text-slate-500 font-medium">Cargando productos...</p>
            </div>
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={shakeProductId === item.id ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.5 }}
                onClick={() => addToCart(item)}
                className={cn(
                  "p-4 rounded-3xl bg-white dark:bg-slate-900 border text-left shadow-sm hover:shadow-xl transition-all group",
                  shakeProductId === item.id 
                    ? "border-rose-500 dark:border-rose-500 ring-2 ring-rose-500/50" 
                    : "border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-900",
                  item.stock_quantity === 0 && "opacity-50 cursor-not-allowed"
                )}
                disabled={item.stock_quantity === 0}
              >
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-32 object-cover rounded-2xl mb-4" />
                ) : (
                  <div className="w-full h-32 rounded-2xl bg-slate-50 dark:bg-slate-800 mb-4 flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors">
                    <span className="text-4xl font-bold text-slate-300 dark:text-slate-600 group-hover:text-emerald-500">{item.name[0]}</span>
                  </div>
                )}
                <h4 className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{item.name}</h4>
                <p className="text-xs text-slate-400 font-medium mb-3 uppercase tracking-widest">{item.sku}</p>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">{formatUSD(item.sale_price_bs / currentExchangeRate)}</span>
                  <span className={cn("text-[10px] font-bold px-2 py-1 rounded-lg", item.stock_quantity > 0 ? "bg-slate-100 dark:bg-slate-800 text-slate-500" : "bg-rose-100 text-rose-500")}>
                    {item.stock_quantity} uds
                  </span>
                </div>
              </motion.button>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium italic">No se encontraron productos que coincidan</p>
            </div>
          )}
          
          {hasMore && !search && (
            <div className="col-span-full py-6 flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => loadMoreProducts()} 
                disabled={loadingAll}
                className="rounded-2xl px-8 py-6 border-2 border-emerald-500/20 text-emerald-600 hover:bg-emerald-50 font-bold transition-all"
              >
                {loadingAll ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Plus className="w-5 h-5 mr-2" />
                )}
                Cargar más productos
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Cart Summary Section */}
      <Card className="w-96 flex flex-col border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-slate-900 text-white p-8">
          <CardTitle className="text-xl flex items-center justify-between mb-4">
            Carrito de Compra
            <span className="bg-emerald-500 text-[10px] px-2 py-1 rounded-full">{cart.length}</span>
          </CardTitle>
          
          {/* Identificación de Cliente */}
          <div className="space-y-3">
            <div className="relative">
              <User className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                selectedCustomer ? "text-emerald-400" : "text-slate-500"
              )} />
              <input 
                type="text"
                placeholder="Cédula del cliente (Enter)"
                value={dni}
                onChange={(e) => {
                  setDni(e.target.value)
                  if (selectedCustomer) setSelectedCustomer(null)
                }}
                onKeyDown={handleDniSearch}
                className="w-full bg-slate-800 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
              {searchingCustomer && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-emerald-500" />}
            </div>
            
            <AnimatePresence>
              {selectedCustomer && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-emerald-500/60 leading-none mb-1">Cliente identificado</span>
                    <span className="text-xs font-bold text-emerald-400">{selectedCustomer.first_name} {selectedCustomer.last_name}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-emerald-500 hover:bg-emerald-500/20"
                    onClick={() => {
                      setSelectedCustomer(null)
                      setDni("")
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 group"
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-slate-400 dark:text-slate-500">{item.name[0]}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-black">{formatBS(item.sale_price_bs * item.quantity)}</p>
                  </div>
<div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-md" 
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className={cn("w-3 h-3", item.quantity <= 1 && "text-slate-300")} />
                      </Button>
                      <span className={cn(
                        "text-sm font-bold w-4 text-center",
                        item.quantity >= item.stock_quantity && "text-rose-500"
                      )}>
                        {item.quantity}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                          "h-6 w-6 rounded-md",
                          item.quantity >= item.stock_quantity && "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        )} 
                        onClick={() => updateQuantity(item.id, 1)}
                        disabled={item.quantity >= item.stock_quantity}
                      >
                        <Plus className={cn("w-3 h-3", item.quantity >= item.stock_quantity && "text-rose-500")} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20" onClick={() => removeFromCart(item.id)}>
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
              <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>Subtotal</span>
                <span>{formatBS(total_bs / 1.16)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>IVA (16%)</span>
                <span>{formatBS(total_bs - total_bs / 1.16)}</span>
              </div>
              <div className="flex justify-between items-end pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-xl font-black text-slate-900 dark:text-white">TOTAL</span>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {formatBS(total_bs)}
                    </span>
                    <span className="text-sm font-bold text-slate-500">
                      {formatUSD(total_bs / currentExchangeRate)}
                    </span>
                  </div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="rounded-2xl h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold flex flex-col text-[10px] gap-1 disabled:opacity-50"
                onClick={() => handleCheckout("card")}
                disabled={checkingOut || cart.length === 0}
              >
                {checkingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                TARJETA
              </Button>
              <Button
                className="rounded-2xl h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex flex-col text-[10px] gap-1 disabled:opacity-50"
                onClick={() => handleCheckout("cash")}
                disabled={checkingOut || cart.length === 0}
              >
                {checkingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <Banknote className="w-5 h-5" />}
                EFECTIVO
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Registro Cliente */}
      <AnimatePresence>
        {showCustomerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 border-b dark:border-slate-800">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
                  <UserPlus className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Nuevo Cliente</h3>
                <p className="text-slate-500 text-sm font-medium">La cédula <span className="text-emerald-500 font-bold">{dni}</span> no está registrada. Por favor, completa los datos.</p>
              </div>
              
              <div className="p-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                    <input 
                      type="text"
                      value={customerForm.first_name}
                      onChange={(e) => setCustomerForm({...customerForm, first_name: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Apellido</label>
                    <input 
                      type="text"
                      value={customerForm.last_name}
                      onChange={(e) => setCustomerForm({...customerForm, last_name: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                  <input 
                    type="text"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Dirección Corta</label>
                  <input 
                    type="text"
                    value={customerForm.address}
                    onChange={(e) => setCustomerForm({...customerForm, address: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="ghost" 
                    className="flex-1 rounded-2xl h-12 font-bold"
                    onClick={() => {
                      setShowCustomerModal(false)
                      setDni("")
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    className="flex-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl h-12 px-8 font-bold shadow-lg shadow-emerald-500/20"
                    onClick={handleCreateCustomer}
                  >
                    Registrar y Continuar
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
