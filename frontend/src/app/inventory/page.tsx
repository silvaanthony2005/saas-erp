"use client";

import { useState } from "react";
import { useInventory } from "@/hooks/useInventory";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Package, Plus, Search, Filter, Edit, Trash2, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { InventoryItem, InventoryItemInput } from "@/services/businessServices";

interface FormErrors {
  name?: string;
  sku?: string;
  sale_price?: string;
  cost_price?: string;
  stock_quantity?: string;
}

function validateForm(data: InventoryItemInput): FormErrors {
  const errors: FormErrors = {};

  if (!data.name?.trim()) {
    errors.name = "El nombre es requerido";
  }

  if (!data.sku?.trim()) {
    errors.sku = "El SKU es requerido";
  }

  if (data.sale_price === undefined || data.sale_price < 0) {
    errors.sale_price = "El precio de venta debe ser un número positivo";
  }

  if (data.cost_price !== undefined && data.cost_price < 0) {
    errors.cost_price = "El precio de costo debe ser un número positivo";
  }

  if (data.stock_quantity !== undefined && data.stock_quantity < 0) {
    errors.stock_quantity = "El stock debe ser un número positivo";
  }

  return errors;
}

const initialFormData: InventoryItemInput = {
  name: "",
  sku: "",
  description: "",
  cost_price: 0,
  sale_price: 0,
  stock_quantity: 0,
  min_stock: 5,
  category_id: 1,
};

export default function InventoryPage() {
  const { items, loading, error, refreshInventory, createItem, updateItem, deleteItem } = useInventory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [formData, setFormData] = useState<InventoryItemInput>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData(initialFormData);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku,
      description: item.description || "",
      cost_price: item.cost_price,
      sale_price: item.sale_price,
      stock_quantity: item.stock_quantity,
      min_stock: item.min_stock || 5,
      category_id: item.category_id,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleInputChange = (field: keyof InventoryItemInput, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await updateItem(editingItem.id, formData);
      } else {
        await createItem(formData);
      }
      await refreshInventory();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving product:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setSelectedItemId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedItemId) {
      try {
        await deleteItem(selectedItemId);
        await refreshInventory();
      } catch (err) {
        console.error("Error deleting product:", err);
      }
    }
    setIsDeleteDialogOpen(false);
    setSelectedItemId(null);
  };

  return (
    <main className="flex-1 p-8 overflow-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Gestión de Inventario</h2>
          <p className="text-slate-500 font-medium">Administra tus productos, stock y precios.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-800">
            <Filter className="w-4 h-4 mr-2" />
            Filtrar
          </Button>
          <Button onClick={handleOpenCreate} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </header>

      {error && (
        <div className="mb-4 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <span className="text-rose-700 dark:text-rose-400 text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl">
          <CardHeader className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-row items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por nombre o SKU..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{items.length} Productos en total</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="px-6 py-4">Producto / SKU</th>
                    <th className="px-6 py-4 text-center">Categoría</th>
                    <th className="px-6 py-4 text-center">Stock</th>
                    <th className="px-6 py-4 text-right">Precio Venta</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {loading && items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          <p className="text-slate-400 font-medium">Cargando productos...</p>
                        </div>
                      </td>
                    </tr>
                  ) : items.map((item, i) => (
                    <motion.tr 
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</span>
                          <span className="text-xs text-slate-400 font-medium">{item.sku}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          General
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn(
                            "px-3 py-1 rounded-lg text-xs font-bold",
                            item.stock_quantity < 10 
                              ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 shadow-sm" 
                              : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                          )}>
                            {item.stock_quantity} uds
                          </span>
                          {item.stock_quantity < 10 && (
                            <span className="text-[10px] text-rose-500 font-black uppercase animate-pulse">Stock Bajo</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">
                        ${formatNumber(item.sale_price)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            onClick={() => handleOpenEdit(item)} 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            onClick={() => handleDeleteClick(item.id)} 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {items.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-slate-300" />
                          </div>
                          <p className="text-slate-400 font-medium italic">No se encontraron productos registrados</p>
                          <Button onClick={handleOpenCreate} className="mt-2 bg-blue-600">Crear Primer Producto</Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={handleCloseModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {editingItem ? "Editar Producto" : "Nuevo Producto"}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={handleCloseModal} className="rounded-lg">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Nombre del producto"
                      className={formErrors.name ? "border-rose-500 focus:ring-rose-500" : ""}
                    />
                    {formErrors.name && <p className="text-xs text-rose-500 mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SKU *</label>
                    <Input
                      value={formData.sku}
                      onChange={(e) => handleInputChange("sku", e.target.value)}
                      placeholder="Código único"
                      className={formErrors.sku ? "border-rose-500 focus:ring-rose-500" : ""}
                    />
                    {formErrors.sku && <p className="text-xs text-rose-500 mt-1">{formErrors.sku}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Precio Venta *</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.sale_price}
                        onChange={(e) => handleInputChange("sale_price", parseFloat(e.target.value) || 0)}
                        className={formErrors.sale_price ? "border-rose-500 focus:ring-rose-500" : ""}
                      />
                      {formErrors.sale_price && <p className="text-xs text-rose-500 mt-1">{formErrors.sale_price}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Precio Costo</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.cost_price}
                        onChange={(e) => handleInputChange("cost_price", parseFloat(e.target.value) || 0)}
                        className={formErrors.cost_price ? "border-rose-500 focus:ring-rose-500" : ""}
                      />
                      {formErrors.cost_price && <p className="text-xs text-rose-500 mt-1">{formErrors.cost_price}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock</label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.stock_quantity}
                      onChange={(e) => handleInputChange("stock_quantity", parseInt(e.target.value) || 0)}
                      className={formErrors.stock_quantity ? "border-rose-500 focus:ring-rose-500" : ""}
                    />
                    {formErrors.stock_quantity && <p className="text-xs text-rose-500 mt-1">{formErrors.stock_quantity}</p>}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1 rounded-xl">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saving} className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700">
                      {saving ? "Guardando..." : editingItem ? "Actualizar" : "Crear"}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDeleteDialogOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsDeleteDialogOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Eliminar Producto</h3>
                    <p className="text-sm text-slate-500">Esta acción no se puede deshacer</p>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  ¿Estás seguro de que deseas eliminar este producto? Todos los datos asociados serán eliminados permanentemente.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 rounded-xl">
                    Cancelar
                  </Button>
                  <Button onClick={handleDeleteConfirm} className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700">
                    Eliminar
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}