import { useState, useEffect, useCallback } from 'react';
import { inventoryService, InventoryItem, InventoryItemInput } from '@/services/businessServices';

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshInventory = async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getAll();
      setItems(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createItem = useCallback(async (data: InventoryItemInput) => {
    setLoading(true);
    try {
      const newItem = await inventoryService.create(data);
      setItems(prev => [...prev, newItem]);
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
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshInventory();
  }, []);

  return { items, loading, error, refreshInventory, createItem, updateItem, deleteItem };
}