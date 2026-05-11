import { fetchApi } from "./apiClient";

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  sale_price: number;
  stock_quantity: number;
  category_id?: number;
}

export const inventoryService = {
  getAll: () => fetchApi<InventoryItem[]>("/inventory/products"),
  getById: (id: number) => fetchApi<InventoryItem>(`/inventory/products/${id}`),
  create: (data: Partial<InventoryItem>) => fetchApi<InventoryItem>("/inventory/products", {
    method: "POST",
    body: JSON.stringify(data),
  }),
};

export const salesService = {
  createSale: (data: any) => fetchApi("/sales", {
    method: "POST",
    body: JSON.stringify(data),
  }),
};

export const hrService = {
  getEmployees: () => fetchApi("/hr/employees"),
};
