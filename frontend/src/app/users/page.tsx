"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fetchApi } from "@/services/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { Shield, ShieldCheck, UserCircle, Plus, X, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

const roleLabels: Record<string, string> = {
  dueño: "Dueño",
  supervisor: "Supervisor / Encargado",
  cajero: "Cajero",
};

const roleIcons: Record<string, typeof Shield> = {
  dueño: ShieldCheck,
  supervisor: Shield,
  cajero: UserCircle,
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ username: "", password: "", full_name: "", role: "cajero" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const pageSize = 20;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<User[]>("/auth/users");
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const paginated = users.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.username.trim()) errs.username = "Requerido";
    if (!editingUser && !formData.password.trim()) errs.password = "Requerido";
    if (!formData.full_name.trim()) errs.full_name = "Requerido";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: any = { username: formData.username, full_name: formData.full_name, role: formData.role };
      if (formData.password) payload.password = formData.password;
      if (editingUser) {
        await fetchApi(`/auth/users/${editingUser.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await fetchApi("/auth/users", { method: "POST", body: JSON.stringify(payload) });
      }
      await fetchUsers();
      setIsModalOpen(false);
      setEditingUser(null);
      setFormData({ username: "", password: "", full_name: "", role: "cajero" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetchApi(`/auth/users/${deleteTarget.id}`, { method: "DELETE" });
      await fetchUsers();
      setDeleteTarget(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openCreate = () => {
    setEditingUser(null);
    setFormData({ username: "", password: "", full_name: "", role: "cajero" });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setFormData({ username: u.username, password: "", full_name: u.full_name, role: u.role });
    setFormErrors({});
    setIsModalOpen(true);
  };

  return (
    <main className="flex-1 p-8 overflow-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Usuarios del Sistema</h2>
          <p className="text-slate-500 font-medium">Administra los accesos y roles del personal.</p>
        </div>
        <Button onClick={openCreate} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Usuario
        </Button>
      </header>

      {error && (
        <div className="mb-4 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span className="text-rose-700 dark:text-rose-400 text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl w-full">
        <CardHeader className="p-6 border-b border-slate-50 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{users.length} Usuarios</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Nombre Completo</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 w-32 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-slate-400 font-medium">Cargando usuarios...</p>
                    </div>
                  </td></tr>
                ) : paginated.map((u, i) => {
                  const RoleIcon = roleIcons[u.role] || UserCircle;
                  const isSelf = currentUser?.id === u.id;
                  return (
                    <motion.tr key={u.id} initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <UserCircle className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                              {u.username}
                              {isSelf && <span className="text-[9px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full">TÚ</span>}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{u.full_name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: u.role === "dueño" ? "#e0f2fe" : u.role === "supervisor" ? "#fef3c7" : "#f0fdf4",
                            color: u.role === "dueño" ? "#0369a1" : u.role === "supervisor" ? "#b45309" : "#15803d",
                          }}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {roleLabels[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold", u.is_active ? "text-emerald-600" : "text-slate-400")}>
                          <span className={cn("w-2 h-2 rounded-full", u.is_active ? "bg-emerald-500" : "bg-slate-300")} />
                          {u.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button onClick={() => openEdit(u)} variant="ghost" size="icon"
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </Button>
                          {!isSelf && (
                            <Button onClick={() => setDeleteTarget(u)} variant="ghost" size="icon"
                              className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-500">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
                {users.length === 0 && !loading && (
                  <tr><td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <UserCircle className="w-12 h-12 text-slate-300" />
                      <p className="text-slate-400 font-medium italic">No hay usuarios registrados</p>
                      <Button onClick={openCreate} className="mt-2 bg-blue-600">Crear Usuario</Button>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50 dark:border-slate-800">
              <p className="text-xs text-slate-500">Página {page} de {totalPages} ({users.length} usuarios)</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setPage(page - 1)} disabled={page <= 1} className="h-8 w-8 rounded-lg">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[3rem] text-center">{page} / {totalPages}</span>
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => { setIsModalOpen(false); setEditingUser(null); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {editingUser ? `Editar: ${editingUser.username}` : "Nuevo Usuario"}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={() => { setIsModalOpen(false); setEditingUser(null); }} className="rounded-lg"><X className="w-5 h-5" /></Button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Usuario *</label>
                    <Input value={formData.username}
                      onChange={(e) => setFormData(p => ({ ...p, username: e.target.value }))}
                      disabled={!!editingUser}
                      className={formErrors.username ? "border-rose-500" : ""} />
                    {formErrors.username && <p className="text-xs text-rose-500 mt-1">{formErrors.username}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {editingUser ? "Contraseña (dejar vacío para no cambiar)" : "Contraseña *"}
                    </label>
                    <Input type="password" value={formData.password}
                      onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                      className={formErrors.password ? "border-rose-500" : ""} />
                    {formErrors.password && <p className="text-xs text-rose-500 mt-1">{formErrors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Completo *</label>
                    <Input value={formData.full_name}
                      onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))}
                      className={formErrors.full_name ? "border-rose-500" : ""} />
                    {formErrors.full_name && <p className="text-xs text-rose-500 mt-1">{formErrors.full_name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rol *</label>
                    <select value={formData.role}
                      onChange={(e) => setFormData(p => ({ ...p, role: e.target.value }))}
                      className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 appearance-none cursor-pointer"
                    >
                      <option value="cajero">Cajero</option>
                      <option value="supervisor">Supervisor / Encargado</option>
                      <option value="dueño">Dueño</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingUser(null); }} className="flex-1 rounded-xl">Cancelar</Button>
                    <Button type="submit" disabled={saving} className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700">
                      {saving ? "Guardando..." : editingUser ? "Actualizar" : "Crear"}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setDeleteTarget(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Eliminar Usuario</h3>
                    <p className="text-sm text-slate-500">Esta acción no se puede deshacer</p>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-2">
                  ¿Eliminar a <strong>{deleteTarget.full_name}</strong> ({deleteTarget.username})?
                </p>
                <p className="text-xs text-slate-400 mb-6">El usuario perderá acceso al sistema.</p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl">Cancelar</Button>
                  <Button onClick={handleDelete} className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700">Eliminar</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
