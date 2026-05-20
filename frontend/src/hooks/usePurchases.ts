import { useState, useEffect, useCallback } from 'react';
import {
  purchaseService, supplierService, inventoryService,
  Purchase, PurchaseInput, Supplier, InventoryItem
} from '@/services/businessServices';

export function usePurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [supplierFilter, setSupplierFilter] = useState<number | undefined>(undefined);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * pageSize;
      const result = await purchaseService.getAll({ skip, limit: pageSize, supplier_id: supplierFilter });
      setPurchases(result.purchases);
      setTotal(result.total);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, supplierFilter]);

  const loadSuppliers = useCallback(async () => {
    try {
      const result = await supplierService.getAll({ limit: 100 });
      setSuppliers(result.suppliers);
    } catch {}
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const result = await inventoryService.getAll({ limit: 100 });
      setProducts(result.products);
    } catch {}
  }, []);

  useEffect(() => {
    loadSuppliers();
    loadProducts();
  }, [loadSuppliers, loadProducts]);

  useEffect(() => { refresh(); }, [refresh]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const create = useCallback(async (data: PurchaseInput) => {
    const item = await purchaseService.create(data);
    setPurchases(prev => [item, ...prev]);
    setTotal(prev => prev + 1);
    return item;
  }, []);

  const cancel = useCallback(async (id: number) => {
    await purchaseService.cancel(id);
    refresh();
  }, [refresh]);

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);

    return {
    purchases, total, page, pageSize, totalPages, supplierFilter,
    suppliers, products, loading, error,
    setSupplierFilter, setPage: goToPage, refresh, loadSuppliers, loadProducts,
    create, cancel
  };
}
