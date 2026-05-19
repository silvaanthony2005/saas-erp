"use client";

import { useState, useRef, useEffect } from "react";
import { useInventory } from "@/hooks/useInventory";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Package, Plus, Search, Filter, Edit, Trash2, X, AlertCircle, ImagePlus, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { formatBS, formatUSD } from "@/lib/currency";
import { InventoryItem, InventoryItemInput, Category, categoryService } from "@/services/businessServices";
import { useExchangeRate } from "@/hooks/useExchangeRate";

interface FormErrors {
  name?: string;
  sku?: string;
  sale_price_bs?: string;
  cost_price_bs?: string;
  stock_quantity?: string;
}

function validateForm(data: InventoryItemInput): FormErrors {
  const errors: FormErrors = {};
  if (!data.name?.trim()) errors.name = "El nombre es requerido";
  if (!data.sku?.trim()) errors.sku = "El SKU es requerido";
  if (data.sale_price_bs === undefined || data.sale_price_bs < 0) errors.sale_price_bs = "El precio de venta debe ser un número positivo";
  if (data.cost_price_bs !== undefined && data.cost_price_bs < 0) errors.cost_price_bs = "El precio de costo debe ser un número positivo";
  if (data.stock_quantity !== undefined && data.stock_quantity < 0) errors.stock_quantity = "El stock debe ser un número positivo";
  return errors;
}

const initialFormData: InventoryItemInput = {
  name: "", sku: "", description: "", image_url: "",
  cost_price_bs: 0, sale_price_bs: 0, stock_quantity: 0, min_stock: 5, category_id: 1,
};

export default function InventoryPage() {
  const {
    items, total, page, pageSize, totalPages, search, categoryId, categories,
    loading, error, setSearch, setCategoryId, goToPage, refreshInventory, loadCategories,
    createItem, updateItem, deleteItem
  } = useInventory();

  const { rate: currentExchangeRate } = useExchangeRate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [formData, setFormData] = useState<InventoryItemInput>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catNameInput, setCatNameInput] = useState("");
  
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const handleSearch = (value: string) => {
    setSearchInput(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(value);
      goToPage(1);
    }, 300);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({ ...initialFormData, category_id: categories[0]?.id || 1 });
    setImagePreview(null);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name, sku: item.sku, description: item.description || "",
      image_url: item.image_url || "", cost_price_bs: item.cost_price_bs,
      sale_price_bs: item.sale_price_bs, stock_quantity: item.stock_quantity,
      min_stock: item.min_stock || 5, category_id: item.category_id,
    });
    setImagePreview(item.image_url || null);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData(initialFormData);
    setImagePreview(null);
    setFormErrors({});
    setShowNewCategory(false);
    setNewCategoryName("");
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    try {
      const newCat = await categoryService.create(newCategoryName);
      await loadCategories();
      setFormData(prev => ({ ...prev, category_id: newCat.id }));
      setShowNewCategory(false);
      setNewCategoryName("");
    } catch (err) {
      console.error("Error creating category:", err);
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleEditCategory = async (cat: Category) => {
    setEditingCategory(cat);
    setCatNameInput(cat.name);
    setIsCategoryModalOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !catNameInput.trim()) return;
    try {
      await categoryService.update(editingCategory.id, catNameInput);
      await loadCategories();
      await refreshInventory();
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
    } catch (err) {
      console.error("Error updating category:", err);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta categoría? Solo se eliminará si no tiene productos asociados.")) return;
    try {
      await categoryService.delete(id);
      await loadCategories();
      await refreshInventory();
    } catch (err: any) {
      alert(err.message || "Error al eliminar la categoría");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setFormData(prev => ({ ...prev, image_url: base64 }));
      };
      reader.readAsDataURL(file);
    }
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
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setSaving(true);
    try {
      if (editingItem) await updateItem(editingItem.id, formData);
      else await createItem(formData);
      await refreshInventory();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving product:", err);
    } finally { setSaving(false); }
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
      } catch (err) { console.error("Error deleting product:", err); }
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
          <Button 
            variant="outline" 
            onClick={() => { setEditingCategory(null); setCatNameInput(""); setIsCategoryModalOpen(true); }}
            className="rounded-xl border-slate-200 dark:border-slate-800"
          >
            <Filter className="w-4 h-4 mr-2" /> Gestionar Categorías
          </Button>
          <Button onClick={handleOpenCreate} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Producto
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
        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl w-full">
          <CardHeader className="p-6 border-b border-slate-50 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Buscar por nombre o SKU..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <select
                  value={categoryId || ""}
                  onChange={(e) => { setCategoryId(e.target.value ? Number(e.target.value) : undefined); goToPage(1); }}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  <option value="">Todas</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">{total} Productos</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="px-6 py-4 w-20">Imagen</th>
                    <th className="px-6 py-4">Producto / SKU</th>
                    <th className="px-6 py-4 w-40 text-center">Categoría</th>
                    <th className="px-6 py-4 w-20 text-center">Stock</th>
                    <th className="px-6 py-4 w-40 text-right">Precio Venta</th>
                    <th className="px-6 py-4 w-24 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {loading && items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
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
                      transition={{ delay: i * 0.03 }}
                      className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-xl object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Package className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</span>
                          <span className="text-xs text-slate-400 font-medium">{item.sku}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          {item.category_name || "General"}
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
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-slate-900 dark:text-white">
                            {formatBS(item.sale_price_bs)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {formatUSD(item.sale_price_bs / currentExchangeRate)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button onClick={() => handleOpenEdit(item)} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => handleDeleteClick(item.id)} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {items.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-slate-300" />
                          </div>
                          <p className="text-slate-400 font-medium italic">No se encontraron productos</p>
                          <Button onClick={handleOpenCreate} className="mt-2 bg-blue-600">Crear Primer Producto</Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50 dark:border-slate-800">
                <p className="text-xs text-slate-500">
                  Página {page} de {totalPages} ({total} productos)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" size="icon"
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className="h-8 w-8 rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;

                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "primary" : "outline"}
                        size="icon"
                        onClick={() => goToPage(pageNum)}
                        className={cn("h-8 w-8 rounded-lg text-xs font-bold", pageNum === page && "bg-blue-600 text-white")}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline" size="icon"
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                    className="h-8 w-8 rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={handleCloseModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingItem ? "Editar Producto" : "Nuevo Producto"}</h3>
                  <Button variant="ghost" size="icon" onClick={handleCloseModal} className="rounded-lg"><X className="w-5 h-5" /></Button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="flex items-center gap-6">
                    <div className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800 group hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label className="cursor-pointer text-white"><Upload className="w-6 h-6" /><input type="file" accept="image/*" onChange={handleImageChange} className="hidden" /></label>
                          </div>
                        </>
                      ) : (
                        <label className="flex flex-col items-center cursor-pointer text-slate-400 hover:text-blue-500 transition-colors">
                          <ImagePlus className="w-8 h-8 mb-1" /><span className="text-xs">Agregar</span>
                          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Imagen del producto</p>
                      <p className="text-xs text-slate-400">PNG, JPG o WEBP hasta 5MB</p>
                      {imagePreview && <button type="button" onClick={() => setImagePreview(null)} className="text-xs text-rose-500 hover:text-rose-600 mt-1">Eliminar imagen</button>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre *</label>
                    <Input value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} placeholder="Nombre del producto" className={formErrors.name ? "border-rose-500 focus:ring-rose-500" : ""} />
                    {formErrors.name && <p className="text-xs text-rose-500 mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SKU *</label>
                    <Input value={formData.sku} onChange={(e) => handleInputChange("sku", e.target.value)} placeholder="Código único" className={formErrors.sku ? "border-rose-500 focus:ring-rose-500" : ""} />
                    {formErrors.sku && <p className="text-xs text-rose-500 mt-1">{formErrors.sku}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                    {!showNewCategory ? (
                      <div className="flex gap-2">
                        <select
                          value={formData.category_id}
                          onChange={(e) => handleInputChange("category_id", Number(e.target.value))}
                          className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon" 
                          onClick={() => setShowNewCategory(true)}
                          className="rounded-xl h-[42px] w-[42px] shrink-0"
                          title="Nueva Categoría"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input 
                          value={newCategoryName} 
                          onChange={(e) => setNewCategoryName(e.target.value)} 
                          placeholder="Nueva categoría..." 
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          onClick={handleCreateCategory}
                          disabled={creatingCategory || !newCategoryName.trim()}
                          className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white h-[42px] px-3 text-xs font-bold"
                        >
                          {creatingCategory ? "..." : "OK"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => setShowNewCategory(false)}
                          className="rounded-xl h-[42px] w-[42px] shrink-0 text-slate-400"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Precio Venta *</label>
                      <Input type="number" step="0.01" min="0" value={formData.sale_price_bs} onChange={(e) => handleInputChange("sale_price_bs", parseFloat(e.target.value) || 0)} className={formErrors.sale_price_bs ? "border-rose-500 focus:ring-rose-500" : ""} />
                      {formErrors.sale_price_bs && <p className="text-xs text-rose-500 mt-1">{formErrors.sale_price_bs}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Precio Costo</label>
                      <Input type="number" step="0.01" min="0" value={formData.cost_price_bs} onChange={(e) => handleInputChange("cost_price_bs", parseFloat(e.target.value) || 0)} className={formErrors.cost_price_bs ? "border-rose-500 focus:ring-rose-500" : ""} />
                      {formErrors.cost_price_bs && <p className="text-xs text-rose-500 mt-1">{formErrors.cost_price_bs}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock</label>
                    <Input type="number" min="0" value={formData.stock_quantity} onChange={(e) => handleInputChange("stock_quantity", parseInt(e.target.value) || 0)} className={formErrors.stock_quantity ? "border-rose-500 focus:ring-rose-500" : ""} />
                    {formErrors.stock_quantity && <p className="text-xs text-rose-500 mt-1">{formErrors.stock_quantity}</p>}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1 rounded-xl">Cancelar</Button>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setIsDeleteDialogOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center"><AlertCircle className="w-6 h-6 text-rose-500" /></div>
                  <div><h3 className="text-lg font-bold text-slate-900 dark:text-white">Eliminar Producto</h3><p className="text-sm text-slate-500">Esta acción no se puede deshacer</p></div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-6">¿Estás seguro de que deseas eliminar este producto?</p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 rounded-xl">Cancelar</Button>
                  <Button onClick={handleDeleteConfirm} className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700">Eliminar</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCategoryModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" onClick={() => setIsCategoryModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 flex items-center justify-center z-[70] p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Gestionar Categorías</h3>
                  <Button variant="ghost" size="icon" onClick={() => setIsCategoryModalOpen(false)}><X className="w-5 h-5" /></Button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      value={catNameInput} 
                      onChange={(e) => setCatNameInput(e.target.value)} 
                      placeholder={editingCategory ? "Nuevo nombre..." : "Nueva categoría..."}
                      className="flex-1"
                    />
                    <Button onClick={editingCategory ? handleUpdateCategory : async () => {
                      if (!catNameInput.trim()) return;
                      await categoryService.create(catNameInput);
                      setCatNameInput("");
                      await loadCategories();
                    }} className="bg-blue-600">
                      {editingCategory ? "Actualizar" : "Añadir"}
                    </Button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 mt-4 pr-2">
                    {categories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 group">
                        <span className="font-medium text-sm">{cat.name}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => handleEditCategory(cat)} className="h-8 w-8 text-blue-500"><Edit className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)} className="h-8 w-8 text-rose-500"><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}