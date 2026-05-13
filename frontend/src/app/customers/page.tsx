"use client"

import { useState, useEffect } from "react"
import { customerService, Customer, CustomerStats } from "@/services/businessServices"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Search, Users, Trophy, ShoppingBag, Phone, MapPin, Calendar, ArrowRight, UserPlus, X, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<CustomerStats[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    dni: "",
    first_name: "",
    last_name: "",
    phone: "",
    address: ""
  })

  const fetchData = async () => {
    try {
      const [customersData, statsData] = await Promise.all([
        customerService.getAll(),
        customerService.getStats()
      ])
      setCustomers(customersData)
      setStats(statsData)
      
      // Actualizar el cliente seleccionado si está abierto el modal de detalle
      if (selectedCustomer) {
        const updated = customersData.find(c => c.id === selectedCustomer.id)
        if (updated) setSelectedCustomer(updated)
      }
    } catch (err) {
      console.error("Error loading customers:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenAdd = () => {
    setFormData({ dni: "", first_name: "", last_name: "", phone: "", address: "" })
    setShowAddModal(true)
  }

  const handleOpenDetail = async (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData({
      dni: customer.dni,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone || "",
      address: customer.address || ""
    })
    setShowDetailModal(true)
    
    // Cargar historial
    setLoadingHistory(true)
    try {
      const historyData = await customerService.getHistory(customer.id)
      setHistory(historyData)
    } catch (err) {
      console.error("Error loading customer history:", err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.dni || !formData.first_name || !formData.last_name) return
    
    setSaving(true)
    try {
      await customerService.create(formData)
      setShowAddModal(false)
      fetchData()
    } catch (err) {
      console.error("Error creating customer:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return
    
    setSaving(true)
    try {
      await customerService.update(selectedCustomer.id, formData)
      setShowDetailModal(false)
      fetchData()
    } catch (err) {
      console.error("Error updating customer:", err)
    } finally {
      setSaving(false)
    }
  }

  const handlePhoneChange = (value: string) => {
    // Eliminar todo lo que no sea número
    const digits = value.replace(/\D/g, "")
    
    let formatted = digits
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 4)} ${digits.slice(4, 11)}`
    }
    
    setFormData({ ...formData, phone: formatted })
  }

  const filteredCustomers = customers.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    c.dni.includes(search)
  )

  const topCustomer = stats[0]

  return (
    <main className="flex-1 p-8 overflow-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Gestión de Clientes</h2>
          <p className="text-slate-500 font-medium tracking-tight">Análisis de lealtad y base de datos de compradores.</p>
        </div>
        <Button 
          onClick={handleOpenAdd}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 px-6 font-bold"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Registrar Cliente
        </Button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white overflow-hidden relative">
          <Users className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
          <CardContent className="p-6">
            <p className="text-indigo-100 text-xs font-black uppercase tracking-widest mb-1">Total Clientes</p>
            <h3 className="text-4xl font-black">{customers.length}</h3>
            <p className="text-indigo-200 text-[10px] mt-2 font-medium">Registrados en la plataforma</p>
          </CardContent>
        </Card>

        {topCustomer && (
          <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden relative border border-amber-100 dark:border-amber-900/20">
            <Trophy className="absolute -right-4 -bottom-4 w-32 h-32 text-amber-500 opacity-5" />
            <CardContent className="p-6">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Cliente VIP</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white truncate">{topCustomer.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {topCustomer.total_purchases} COMPRAS
                </span>
                <span className="text-slate-400 text-[10px] font-bold">
                  ${formatNumber(topCustomer.total_spent)} invertidos
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden relative">
          <ShoppingBag className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-200 dark:text-slate-800 opacity-20" />
          <CardContent className="p-6">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Frecuencia Media</p>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white">
              {customers.length > 0 ? (stats.reduce((acc, s) => acc + s.total_purchases, 0) / customers.length).toFixed(1) : 0}
            </h3>
            <p className="text-slate-400 text-[10px] mt-2 font-medium">Compras por cliente</p>
          </CardContent>
        </Card>
      </div>

      {/* Main List */}
      <Card className="border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
        <CardHeader className="p-8 border-b dark:border-slate-800 flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
            Base de Datos
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] px-2 py-1 rounded-full uppercase">
              {filteredCustomers.length} Resultados
            </span>
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar por DNI o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-left">
                  <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Cliente</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Identificación</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Contacto</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Registrado</th>
                  <th className="px-8 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {filteredCustomers.map((c, i) => (
                  <motion.tr 
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold">
                          {c.first_name[0]}{c.last_name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{c.first_name} {c.last_name}</p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <MapPin className="w-3 h-3" />
                            {c.address || "Sin dirección"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                        {c.dni}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Phone className="w-4 h-4" />
                        {c.phone || "---"}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Calendar className="w-4 h-4" />
                        {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleOpenDetail(c)}
                        className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ArrowRight className="w-4 h-4 text-indigo-500" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filteredCustomers.length === 0 && (
              <div className="p-20 text-center flex flex-col items-center gap-4">
                <Users className="w-16 h-16 text-slate-200 dark:text-slate-800" />
                <p className="text-slate-400 font-medium italic">No se encontraron clientes que coincidan</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal Añadir Cliente */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-8 border-b dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Registrar Cliente</h3>
                    <p className="text-slate-500 text-xs font-medium">Completa los datos para el registro.</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowAddModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <form onSubmit={handleAddSubmit} className="p-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Número de Cédula / ID</label>
                  <input 
                    type="text"
                    required
                    value={formData.dni}
                    onChange={(e) => setFormData({...formData, dni: e.target.value})}
                    placeholder="Ej: 12345678"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nombre</label>
                    <input 
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      placeholder="Juan"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Apellido</label>
                    <input 
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      placeholder="Pérez"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Teléfono</label>
                  <input 
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="0412 1234567"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Dirección</label>
                  <input 
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Calle Falsa 123"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                
                <div className="flex gap-3 pt-6">
                  <Button 
                    type="button"
                    variant="ghost" 
                    className="flex-1 rounded-2xl h-14 font-bold"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={saving}
                    className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 font-bold shadow-xl shadow-indigo-600/20"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Cliente"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Detalle y Edición de Cliente */}
      <AnimatePresence>
        {showDetailModal && selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-8 border-b dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/20">
                    {selectedCustomer.first_name[0]}{selectedCustomer.last_name[0]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                      {selectedCustomer.first_name} {selectedCustomer.last_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        DNI: {selectedCustomer.dni}
                      </span>
                      <span className="text-slate-400 text-[10px] font-bold uppercase">
                        Desde {new Date(selectedCustomer.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowDetailModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 h-[500px]">
                {/* Sidebar del Modal: Stats */}
                <div className="col-span-2 border-r dark:border-slate-800 p-8 space-y-6 overflow-y-auto bg-slate-50/30 dark:bg-slate-800/20">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Métricas de Valor</h4>
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Total Invertido</p>
                        <p className="text-2xl font-black text-emerald-500">
                          ${formatNumber(stats.find(s => s.name.includes(selectedCustomer.first_name))?.total_spent || 0)}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Frecuencia</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">
                          {stats.find(s => s.name.includes(selectedCustomer.first_name))?.total_purchases || 0} Compras
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Historial Reciente</h4>
                    <div className="space-y-3">
                      {loadingHistory ? (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Cargando facturas...
                        </div>
                      ) : history.length > 0 ? (
                        history.map((t) => (
                          <div key={t.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 group/item hover:border-indigo-500/30 transition-colors">
                            <div className="flex justify-between items-start">
                              <p className="text-[10px] font-bold text-slate-400">{new Date(t.date).toLocaleDateString()}</p>
                              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">{t.method}</span>
                            </div>
                            <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
                              ${formatNumber(t.total)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No hay compras registradas</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main del Modal: Formulario de Edición */}
                <form onSubmit={handleUpdateSubmit} className="col-span-3 p-8 space-y-5 overflow-y-auto">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Editar Información</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nombre</label>
                      <input 
                        type="text"
                        required
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Apellido</label>
                      <input 
                        type="text"
                        required
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">DNI (No editable)</label>
                    <input 
                      type="text"
                      disabled
                      value={formData.dni}
                      className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl p-4 text-sm text-slate-400 outline-none cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Teléfono</label>
                    <input 
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Dirección</label>
                    <textarea 
                      rows={3}
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="submit"
                      disabled={saving}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 font-bold shadow-xl shadow-indigo-600/20"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Cambios"}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
