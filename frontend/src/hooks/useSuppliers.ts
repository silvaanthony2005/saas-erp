import { useState, useEffect, useCallback } from 'react';
import { supplierService, Supplier, SupplierInput } from '@/services/businessServices';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * pageSize;
      const result = await supplierService.getAll({ skip, limit: pageSize, search });
      setSuppliers(result.suppliers);
      setTotal(result.total);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => { refresh(); }, [refresh]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const create = useCallback(async (data: SupplierInput) => {
    const item = await supplierService.create(data);
    setSuppliers(prev => [item, ...prev]);
    setTotal(prev => prev + 1);
    return item;
  }, []);

  const update = useCallback(async (id: number, data: SupplierInput) => {
    const item = await supplierService.update(id, data);
    setSuppliers(prev => prev.map(s => s.id === id ? item : s));
    return item;
  }, []);

  const remove = useCallback(async (id: number) => {
    await supplierService.delete(id);
    setSuppliers(prev => prev.filter(s => s.id !== id));
    setTotal(prev => prev - 1);
  }, []);

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);

  return {
    suppliers, total, page, pageSize, totalPages, search,
    loading, error,
    setSearch, setPage: goToPage, refresh,
    create, update, remove
  };
}
