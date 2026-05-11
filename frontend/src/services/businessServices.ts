import { fetchApi } from "./apiClient";

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  description?: string;
  image_url?: string;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  min_stock?: number;
  category_id: number;
}

export interface InventoryItemInput {
  name: string;
  sku: string;
  description?: string;
  image_url?: string;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  min_stock?: number;
  category_id: number;
}

export const inventoryService = {
  getAll: () => fetchApi<InventoryItem[]>("/inventory/products"),
  getById: (id: number) => fetchApi<InventoryItem>(`/inventory/products/${id}`),
  create: (data: InventoryItemInput) => fetchApi<InventoryItem>("/inventory/products", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: number, data: Partial<InventoryItemInput>) => fetchApi<InventoryItem>(`/inventory/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchApi<{ message: string }>(`/inventory/products/${id}`, {
    method: "DELETE",
  }),
};

export const salesService = {
  createSale: (data: any) => fetchApi("/sales", {
    method: "POST",
    body: JSON.stringify(data),
  }),
};

export { hrService, type Employee, type Payroll, type PayrollProcessData } from './hrService';
export { inventoryService as default };

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  timestamp: string;
}

export interface Income {
  id: number;
  description: string;
  amount: number;
  category: string;
  timestamp: string;
  entry_type?: string;
}

export interface FinancialSummary {
  total_income: number;
  total_expenses: number;
  net_profit: number;
  period_start?: string;
  period_end?: string;
}

export const accountingService = {
  getExpenses: () => fetchApi<Expense[]>("/accounting/expenses"),
  createExpense: (data: Partial<Expense>) => fetchApi<Expense>("/accounting/expenses", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  deleteExpense: (id: number) => fetchApi(`/accounting/expenses/${id}`, {
    method: "DELETE",
  }),
  getIncomes: () => fetchApi<Income[]>("/accounting/income"),
  createIncome: (data: Partial<Income>) => fetchApi<Income>("/accounting/income", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  deleteIncome: (id: number) => fetchApi(`/accounting/income/${id}`, {
    method: "DELETE",
  }),
  getSummary: () => fetchApi<FinancialSummary>("/accounting/summary"),
};
