"use client";

import { useState, useRef, useEffect } from "react";
import { usePurchases } from "@/hooks/usePurchases";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FileText, Plus, Search, X, AlertCircle, ChevronLeft, ChevronRight, Building2, Eye, Ban } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatBS, formatUSD } from "@/lib/currency";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { PurchaseInput, PurchaseDetailInput, InventoryItem, categoryService, inventoryService } from "@/services/businessServices";

const initialFormData: PurchaseInput = {
  invoice_number: "", supplier_id: 0,
  subtotal_bs: 0, tax_bs: 0, total_bs: 0,
  exchange_rate: undefined,
  payment_type: "cash",
  invoice_date: new Date().toISOString().split("T")[0],
  due_date: "", notes: "",
  details: [],
};

export default function PurchasesPage() {
  const {
    purchases, total, page, pageSize, totalPages, supplierFilter,
    suppliers, products, loading, error,
    setSupplierFilter, setPage, refresh, loadSuppliers, loadProducts, create, cancel
  } = usePurchases();

  const {
    rate: exchangeRate
  } = useExchangeRate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<PurchaseInput>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);
  const [selectedCost, setSelectedCost] = useState(0);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductSku, setNewProductSku] = useState("");
  const [newProductSalePrice, setNewProductSalePrice] = useState(0);
  const [newProductCategoryId, setNewProductCategoryId] = useState(0);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const productSearchRef = useRef<HTMLDivElement>(null);

  const handleOpenCreate = () => {
    setFormData(initialFormData);
    loadSuppliers();
    loadProducts();
    categoryService.getAll().then(setCategories).catch(() => {});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormData);
    setProductSearch("");
    setSelectedProduct("");
    setSelectedQty(1);
    setSelectedCost(0);
    setShowProductDropdown(false);
    setShowCreateProduct(false);
    setNewProductName("");
    setNewProductSku("");
    setNewProductSalePrice(0);
    setNewProductCategoryId(0);
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) return;
    setCreatingProduct(true);
    try {
      const newProd = await inventoryService.create({
        name: newProductName.trim(),
        sku: newProductSku.trim() || newProductName.trim().substring(0, 3).toUpperCase() + Date.now().toString().slice(-6),
        cost_price_bs: 0,
        sale_price_bs: newProductSalePrice,
        stock_quantity: 0,
        category_id: newProductCategoryId || 1,
      });
      await loadProducts();
      setSelectedProduct(String(newProd.id));
      setSelectedCost(selectedCost || 0);
      setShowCreateProduct(false);
      setShowProductDropdown(false);
      setNewProductName("");
      setNewProductSku("");
      setNewProductSalePrice(0);
      setNewProductCategoryId(0);
    } catch (err) { console.error(err); }
    finally { setCreatingProduct(false); }
  };

  const handleAddDetail = () => {
    if (!selectedProduct) return;
    const product = products.find(p => p.id === Number(selectedProduct));
    if (!product) return;
    const detail: PurchaseDetailInput = {
      product_id: product.id,
      quantity: selectedQty,
      unit_cost_bs: selectedCost,
    };
    const newDetails = [...formData.details, detail];
    const subtotal = newDetails.reduce((s, d) => s + d.quantity * d.unit_cost_bs, 0);
    setFormData(prev => ({
      ...prev,
      details: newDetails,
      subtotal_bs: subtotal,
      total_bs: subtotal + prev.tax_bs,
    }));
    setProductSearch("");
    setSelectedProduct("");
    setSelectedQty(1);
    setSelectedCost(0);
    setShowProductDropdown(false);
  };

  const handleRemoveDetail = (idx: number) => {
    const newDetails = formData.details.filter((_, i) => i !== idx);
    const subtotal = newDetails.reduce((s, d) => s + d.quantity * d.unit_cost_bs, 0);
    setFormData(prev => ({
      ...prev,
      details: newDetails,
      subtotal_bs: subtotal,
      total_bs: subtotal + prev.tax_bs,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier_id || formData.details.length === 0) return;
    setSaving(true);
    try {
      await create(formData);
      refresh();
      handleCloseModal();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("¿Estás seguro de anular esta factura de compra?")) return;
    try { await cancel(id); } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (productSearchRef.current && !productSearchRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
      cancelled: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
    };
    const labels: Record<string, string> = { active: "Activa", cancelled: "Anulada" };
    return (
      <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", styles[status] || "")}>
        {labels[status] || status}
      </span>
    );
  };

  const getPaymentBadge = (type: string) => {
    if (type === "paid") return <span className="text-[10px] font-bold text-emerald-500 uppercase">Pagada</span>;
    if (type === "credit") return <span className="text-[10px] font-bold text-amber-500 uppercase">Crédito</span>;
    return <span className="text-[10px] font-bold text-blue-500 uppercase">Contado</span>;
  };

  return (
    <main className="flex-1 p-8 overflow-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Compras</h2>
          <p className="text-slate-500 font-medium">Registro de facturas de compra y gestión de inventario.</p>
        </div>
        <Button onClick={handleOpenCreate} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
          <Plus className="w-4 h-4 mr-2" /> Nueva Compra
        </Button>
      </header>

      {error && (
        <div className="mb-4 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <span className="text-rose-700 dark:text-rose-400 text-sm">{error}</span>
        </div>
      )}

      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl w-full">
        <CardHeader className="p-6 border-b border-slate-50 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <select
              value={supplierFilter || ""}
              onChange={(e) => { setSupplierFilter(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="">Todos los proveedores</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.company_name}</option>
              ))}
            </select>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">{total} Facturas</p>
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
                  <th className="px-6 py-4 text-right">Subtotal</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-center">Pago</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {loading && purchases.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-slate-400 font-medium">Cargando facturas...</p>
                    </div>
                  </td></tr>
                ) : purchases.map((p, i) => (
                  <motion.tr key={p.id} initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{p.invoice_number}</span>
                          <span className="block text-[10px] text-slate-400 font-medium">
                            {new Date(p.created_at).toLocaleDateString("es-VE")}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
                        <Building2 className="w-3 h-3" /> {p.supplier_name || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(p.status)}</td>
                    <td className="px-6 py-4 text-right font-medium text-sm">{formatBS(p.subtotal_bs)}</td>
                    <td className="px-6 py-4 text-right font-bold text-sm">{formatBS(p.total_bs)}</td>
                    <td className="px-6 py-4 text-center">{getPaymentBadge(p.payment_type)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.status === "active" && (
                          <Button onClick={() => handleCancel(p.id)} variant="ghost" size="icon"
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-500" title="Anular">
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {purchases.length === 0 && !loading && (
                  <tr><td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="w-12 h-12 text-slate-300" />
                      <p className="text-slate-400 font-medium italic">No hay facturas de compra</p>
                      <Button onClick={handleOpenCreate} className="mt-2 bg-blue-600">Registrar Compra</Button>
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
                <Button variant="outline" size="icon" onClick={() => setPage(page - 1)} disabled={page <= 1} className="h-8 w-8 rounded-lg">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pn = i + 1;
                  if (totalPages > 5) {
                    if (page <= 3) pn = i + 1;
                    else if (page >= totalPages - 2) pn = totalPages - 4 + i;
                    else pn = page - 2 + i;
                  }
                  return (<Button key={pn} variant={pn === page ? "primary" : "outline"} size="icon"
                    onClick={() => setPage(pn)}
                    className={cn("h-8 w-8 rounded-lg text-xs font-bold", pn === page && "bg-blue-600 text-white")}>{pn}</Button>);
                })}
                <Button variant="outline" size="icon" onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="h-8 w-8 rounded-lg">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={handleCloseModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nueva Factura de Compra</h3>
                  <Button variant="ghost" size="icon" onClick={handleCloseModal} className="rounded-lg"><X className="w-5 h-5" /></Button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Proveedor *</label>
                      <select value={formData.supplier_id} onChange={(e) => setFormData(p => ({ ...p, supplier_id: Number(e.target.value) }))}
                        className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value={0}>Seleccionar proveedor</option>
                        {suppliers.map(s => (<option key={s.id} value={s.id}>{s.company_name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">N° Factura *</label>
                      <Input value={formData.invoice_number} onChange={(e) => setFormData(p => ({ ...p, invoice_number: e.target.value }))} placeholder="FAC-001" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha Factura</label>
                      <Input type="date" value={formData.invoice_date || ""} onChange={(e) => setFormData(p => ({ ...p, invoice_date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Pago</label>
                      <select value={formData.payment_type} onChange={(e) => setFormData(p => ({ ...p, payment_type: e.target.value }))}
                        className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="cash">Contado</option>
                        <option value="credit">Línea de Crédito</option>
                      </select>
                    </div>
                  </div>

                  {formData.payment_type === "credit" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha Vencimiento</label>
                      <Input type="date" value={formData.due_date || ""} onChange={(e) => setFormData(p => ({ ...p, due_date: e.target.value }))} />
                    </div>
                  )}

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Detalle de Productos</label>

                    <div className="grid grid-cols-12 gap-2 mb-3 items-end">
                      <div className="col-span-5 relative" ref={productSearchRef}>
                        <label className="block text-xs text-slate-500 mb-1">Producto</label>
                        <div className="relative">
                          <Input
                            value={selectedProduct ? (products.find(p => p.id === Number(selectedProduct))?.name || "") : productSearch}
                            onChange={(e) => {
                              setProductSearch(e.target.value);
                              setSelectedProduct("");
                              setSelectedCost(0);
                              setShowProductDropdown(true);
                            }}
                            onFocus={() => { if (!selectedProduct) setShowProductDropdown(true); }}
                            placeholder="Buscar producto..."
                            className="pr-8"
                          />
                          {selectedProduct && (
                            <button type="button" onClick={() => { setSelectedProduct(""); setProductSearch(""); setSelectedCost(0); }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        {showProductDropdown && !selectedProduct && (
                          <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl">
                            {products
                              .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))
                              .slice(0, 50)
                              .map(p => (
                                <button key={p.id} type="button" onClick={() => {
                                  setSelectedProduct(String(p.id));
                                  setSelectedCost(p.cost_price_bs);
                                  setShowProductDropdown(false);
                                }}
                                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-slate-50 dark:border-slate-700/50 last:border-0 transition-colors"
                                >
                                  <span className="font-medium">{p.name}</span>
                                  <span className="ml-2 text-xs text-slate-400">{p.sku}</span>
                                  <span className="float-right text-xs text-slate-500">Bs. {p.cost_price_bs}</span>
                                </button>
                              ))}
                            {productSearch && products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                              <button type="button" onClick={() => { setShowCreateProduct(true); setShowProductDropdown(false); }}
                                className="w-full text-left px-3 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-slate-50 dark:border-slate-700/50 transition-colors"
                              >
                                <Plus className="w-4 h-4 inline mr-1.5" /> Crear &quot;{productSearch}&quot;
                              </button>
                            )}
                            {!productSearch && (
                              <button type="button" onClick={() => { setShowCreateProduct(true); setShowProductDropdown(false); }}
                                className="w-full text-left px-3 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              >
                                <Plus className="w-4 h-4 inline mr-1.5" /> Nuevo producto
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-slate-500 mb-1">Cantidad</label>
                        <Input type="number" min="1" value={selectedQty} onChange={(e) => setSelectedQty(parseInt(e.target.value) || 1)} />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-xs text-slate-500 mb-1">Costo Unit. (Bs)</label>
                        <Input type="number" step="0.01" min="0" value={selectedCost} onChange={(e) => setSelectedCost(parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="col-span-2">
                        <Button type="button" onClick={handleAddDetail} disabled={!selectedProduct}
                          className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold">
                          +
                        </Button>
                      </div>
                    </div>

                    {showCreateProduct && (
                      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Nuevo Producto</p>
                          <button type="button" onClick={() => setShowCreateProduct(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs text-slate-500 mb-1">Nombre *</label>
                            <Input value={newProductName} onChange={(e) => {
                              setNewProductName(e.target.value);
                              if (!newProductSku) setNewProductSku(e.target.value.substring(0, 3).toUpperCase() + Date.now().toString().slice(-6));
                            }} placeholder="Nombre del producto" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">SKU</label>
                            <Input value={newProductSku} onChange={(e) => setNewProductSku(e.target.value)} placeholder="SKU-001" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Precio Venta (Bs) *</label>
                            <Input type="number" step="0.01" min="0" value={newProductSalePrice}
                              onChange={(e) => setNewProductSalePrice(parseFloat(e.target.value) || 0)} placeholder="0.00" />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-slate-500 mb-1">Categoría</label>
                            <select value={newProductCategoryId} onChange={(e) => setNewProductCategoryId(Number(e.target.value))}
                              className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value={0}>Sin categoría</option>
                              {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={() => setShowCreateProduct(false)} className="flex-1 rounded-xl text-sm">Cancelar</Button>
                          <Button type="button" onClick={handleCreateProduct} disabled={creatingProduct || !newProductName.trim()}
                            className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm">
                            {creatingProduct ? "Creando..." : "Crear Producto"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {formData.details.length > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {formData.details.map((d, idx) => {
                          const prod = products.find(p => p.id === d.product_id);
                          return (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                              <div className="flex-1">
                                <span className="font-medium text-sm">{prod?.name || `ID: ${d.product_id}`}</span>
                                <span className="ml-3 text-xs text-slate-400">x{d.quantity}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-sm">{formatBS(d.unit_cost_bs * d.quantity)}</span>
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveDetail(idx)}
                                  className="h-7 w-7 text-rose-400 hover:text-rose-600">
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subtotal (Bs)</label>
                      <Input type="number" step="0.01" value={formData.subtotal_bs} readOnly className="bg-slate-50 dark:bg-slate-800/50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">IVA/Impuesto (Bs)</label>
                      <Input type="number" step="0.01" min="0" value={formData.tax_bs}
                        onChange={(e) => {
                          const tax = parseFloat(e.target.value) || 0;
                          setFormData(p => ({ ...p, tax_bs: tax, total_bs: p.subtotal_bs + tax }));
                        }} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Total (Bs)</label>
                    <Input type="number" value={formData.total_bs} readOnly className="bg-blue-50 dark:bg-blue-900/20 font-bold text-lg" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas</label>
                    <textarea value={formData.notes || ""} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                      className="w-full h-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Notas opcionales..." />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1 rounded-xl">Cancelar</Button>
                    <Button type="submit" disabled={saving || !formData.supplier_id || formData.details.length === 0}
                      className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700">
                      {saving ? "Guardando..." : "Registrar Compra"}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
