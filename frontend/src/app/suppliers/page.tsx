"use client";

import { useState, useRef, useEffect } from "react";
import { useSuppliers } from "@/hooks/useSuppliers";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Building2, Plus, Search, Edit, Trash2, X, AlertCircle, ChevronLeft, ChevronRight, Phone, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SupplierInput } from "@/services/businessServices";

interface FormErrors {
  company_name?: string;
  dni_rif?: string;
}

function validateForm(data: SupplierInput): FormErrors {
  const errors: FormErrors = {};
  if (!data.company_name?.trim()) errors.company_name = "El nombre de la empresa es requerido";
  if (!data.dni_rif?.trim()) errors.dni_rif = "El RIF/DNI es requerido";
  return errors;
}

const initialFormData: SupplierInput = {
  company_name: "", contact_name: "", email: "", phone: "", address: "", dni_rif: "",
};

export default function SuppliersPage() {
  const {
    suppliers, total, page, pageSize, totalPages, search,
    loading, error, setSearch, setPage, refresh,
    create, update, remove
  } = useSuppliers();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<typeof suppliers[0] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formData, setFormData] = useState<SupplierInput>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setSearchInput(search); }, [search]);

  const handleSearch = (value: string) => {
    setSearchInput(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(value); setPage(1); }, 300);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData(initialFormData);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: typeof suppliers[0]) => {
    setEditingItem(item);
    setFormData({
      company_name: item.company_name, contact_name: item.contact_name || "",
      email: item.email || "", phone: item.phone || "",
      address: item.address || "", dni_rif: item.dni_rif,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setSaving(true);
    try {
      if (editingItem) await update(editingItem.id, formData);
      else await create(formData);
      refresh();
      handleCloseModal();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDeleteClick = (id: number) => {
    setSelectedId(id);
    setDeleteError(null);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedId) return;
    try {
      await remove(selectedId);
      refresh();
      setIsDeleteOpen(false);
      setSelectedId(null);
      setDeleteError(null);
    } catch (err: any) {
      setDeleteError(err.message || "Error al eliminar el proveedor");
    }
  };

  return (
    <main className="flex-1 p-8 overflow-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Proveedores</h2>
          <p className="text-slate-500 font-medium">Gestiona tus proveedores y datos de contacto.</p>
        </div>
        <Button onClick={handleOpenCreate} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Proveedor
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
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Buscar por nombre o RIF..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">{total} Proveedores</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="px-6 py-4">Empresa</th>
                  <th className="px-6 py-4">RIF/DNI</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Teléfono</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4 w-24 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {loading && suppliers.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-slate-400 font-medium">Cargando proveedores...</p>
                    </div>
                  </td></tr>
                ) : suppliers.map((s, i) => (
                  <motion.tr
                    key={s.id} initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-slate-400" />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{s.company_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-slate-600 dark:text-slate-400">{s.dni_rif}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{s.contact_name || "—"}</td>
                    <td className="px-6 py-4">
                      {s.phone ? (
                        <span className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                          <Phone className="w-3 h-3" /> {s.phone}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {s.email ? (
                        <span className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                          <Mail className="w-3 h-3" /> {s.email}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button onClick={() => handleOpenEdit(s)} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-500">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => handleDeleteClick(s.id)} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {suppliers.length === 0 && !loading && (
                  <tr><td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Building2 className="w-12 h-12 text-slate-300" />
                      <p className="text-slate-400 font-medium italic">No se encontraron proveedores</p>
                      <Button onClick={handleOpenCreate} className="mt-2 bg-blue-600">Crear Proveedor</Button>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50 dark:border-slate-800">
              <p className="text-xs text-slate-500">Página {page} de {totalPages} ({total} proveedores)</p>
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
                  return (
                    <Button key={pn} variant={pn === page ? "primary" : "outline"} size="icon"
                      onClick={() => setPage(pn)}
                      className={cn("h-8 w-8 rounded-lg text-xs font-bold", pn === page && "bg-blue-600 text-white")}>
                      {pn}
                    </Button>
                  );
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
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {editingItem ? "Editar Proveedor" : "Nuevo Proveedor"}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={handleCloseModal} className="rounded-lg"><X className="w-5 h-5" /></Button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Empresa *</label>
                    <Input value={formData.company_name} onChange={(e) => setFormData(p => ({ ...p, company_name: e.target.value }))}
                      className={formErrors.company_name ? "border-rose-500" : ""} />
                    {formErrors.company_name && <p className="text-xs text-rose-500 mt-1">{formErrors.company_name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">RIF/DNI *</label>
                    <Input value={formData.dni_rif} onChange={(e) => setFormData(p => ({ ...p, dni_rif: e.target.value }))}
                      className={formErrors.dni_rif ? "border-rose-500" : ""} />
                    {formErrors.dni_rif && <p className="text-xs text-rose-500 mt-1">{formErrors.dni_rif}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Contacto</label>
                    <Input value={formData.contact_name || ""} onChange={(e) => setFormData(p => ({ ...p, contact_name: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono</label>
                      <Input value={formData.phone || ""} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                      <Input type="email" value={formData.email || ""} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dirección</label>
                    <Input value={formData.address || ""} onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))} />
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
        {isDeleteOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setIsDeleteOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", deleteError ? "bg-rose-100 dark:bg-rose-900/30" : "bg-amber-100 dark:bg-amber-900/30")}>
                    <AlertCircle className={cn("w-6 h-6", deleteError ? "text-rose-500" : "text-amber-500")} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {deleteError ? "No se pudo eliminar" : "Eliminar Proveedor"}
                    </h3>
                    <p className="text-sm text-slate-500">Los proveedores con compras no pueden eliminarse</p>
                  </div>
                </div>
                {deleteError ? (
                  <div className="mb-6 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
                    <p className="text-sm text-rose-700 dark:text-rose-400">{deleteError}</p>
                  </div>
                ) : (
                  <p className="text-slate-600 dark:text-slate-400 mb-6">¿Estás seguro de eliminar este proveedor?</p>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setDeleteError(null); }} className="flex-1 rounded-xl">
                    {deleteError ? "Cerrar" : "Cancelar"}
                  </Button>
                  {!deleteError && (
                    <Button onClick={handleDeleteConfirm} className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700">Eliminar</Button>
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
