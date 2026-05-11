import { useState, useEffect } from 'react';
import { inventoryService, InventoryItem } from '@/services/businessServices';

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

  useEffect(() => {
    refreshInventory();
  }, []);

  return { items, loading, error, refreshInventory };
}
