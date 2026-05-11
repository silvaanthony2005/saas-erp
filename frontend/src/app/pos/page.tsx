"use client"

import { useState, useRef } from "react"
import { useInventory } from "@/hooks/useInventory"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { ShoppingCart, Search, Trash2, Plus, Minus, CreditCard, Banknote, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { InventoryItem } from "@/services/businessServices"

interface CartItem extends InventoryItem {
  quantity: number
}

interface Toast {
  id: number
  message: string
  type: "warning" | "error"
}

export default function POSPage() {
  const { items } = useInventory()
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState("")
  const [toasts, setToasts] = useState<Toast[]>([])
  const [shakeProductId, setShakeProductId] = useState<number | null>(null)
  const toastIdRef = useRef(0)

  const showToast = (message: string, type: "warning" | "error" = "warning") => {
    toastIdRef.current += 1
    const id = toastIdRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
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

  const total = cart.reduce((acc, item) => acc + (item.sale_price * item.quantity), 0)

  const filteredItems = items.filter(i => 
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
                  : "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
              )}
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Product Selection Section */}
      <div className="flex-1 flex flex-col gap-6">
        <header className="flex flex-col gap-4">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-emerald-500" />
            Punto de Venta (POS)
          </h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Escanear SKU o buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border-none shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-lg font-medium"
            />
          </div>
        </header>

        <div className="flex-1 overflow-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
          {filteredItems.map((item) => (
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
              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 mb-4 flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors">
                <span className="text-2xl font-bold text-slate-300 dark:text-slate-600 group-hover:text-emerald-500">{item.name[0]}</span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{item.name}</h4>
              <p className="text-xs text-slate-400 font-medium mb-3 uppercase tracking-widest">{item.sku}</p>
              <div className="flex items-center justify-between">
                <span className="text-emerald-600 dark:text-emerald-400 font-black">${formatNumber(item.sale_price)}</span>
                <span className={cn("text-[10px] font-bold px-2 py-1 rounded-lg", item.stock_quantity > 0 ? "bg-slate-100 dark:bg-slate-800 text-slate-500" : "bg-rose-100 text-rose-500")}>
                  {item.stock_quantity} uds
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Cart Summary Section */}
      <Card className="w-96 flex flex-col border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-slate-900 text-white p-8">
          <CardTitle className="text-xl flex items-center justify-between">
            Carrito de Compra
            <span className="bg-emerald-500 text-[10px] px-2 py-1 rounded-full">{cart.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <div className="flex-1 overflow-auto p-6 space-y-4">
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 group"
                >
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-black">${formatNumber(item.sale_price * item.quantity)}</p>
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
                <span>${(total * 0.84).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>IVA (16%)</span>
                <span>${(total * 0.16).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-2xl font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>TOTAL</span>
                <span>${formatNumber(total)}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button className="rounded-2xl h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold flex flex-col text-[10px] gap-1">
                <CreditCard className="w-5 h-5" />
                TARJETA
              </Button>
              <Button className="rounded-2xl h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex flex-col text-[10px] gap-1">
                <Banknote className="w-5 h-5" />
                EFECTIVO
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
