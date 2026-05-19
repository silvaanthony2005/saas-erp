import { useState, useEffect, useCallback } from 'react';
import { inventoryService, categoryService, InventoryItem, InventoryItemInput, Category } from '@/services/businessServices';

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshInventory = useCallback(async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * pageSize;
      const result = await inventoryService.getAll({ skip, limit: pageSize, search, category_id: categoryId });
      setItems(result.products);
      setTotal(result.total);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, categoryId]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch {}
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    refreshInventory();
  }, [refreshInventory]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const createItem = useCallback(async (data: InventoryItemInput) => {
    setLoading(true);
    try {
      const newItem = await inventoryService.create(data);
      setItems(prev => [newItem, ...prev]);
      setTotal(prev => prev + 1);
      setError(null);
      return newItem;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateItem = useCallback(async (id: number, data: Partial<InventoryItemInput>) => {
    setLoading(true);
    try {
      const updatedItem = await inventoryService.update(id, data);
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      setError(null);
      return updatedItem;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteItem = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await inventoryService.delete(id);
      setItems(prev => prev.filter(item => item.id !== id));
      setTotal(prev => prev - 1);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);

  return {
    items, total, page, pageSize, totalPages, search, categoryId, categories,
    loading, error,
    setSearch, setCategoryId, goToPage, refreshInventory, loadCategories,
    createItem, updateItem, deleteItem
  };
}
