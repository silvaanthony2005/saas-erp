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
  category_name?: string;
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

export interface PaginatedResponse<T> {
  products: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface Category {
  id: number;
  name: string;
}

export const inventoryService = {
  getAll: (params?: { skip?: number; limit?: number; search?: string; category_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.skip) query.set("skip", String(params.skip));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.search) query.set("search", params.search);
    if (params?.category_id) query.set("category_id", String(params.category_id));
    return fetchApi<PaginatedResponse<InventoryItem>>(`/inventory/products?${query}`);
  },
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

export const categoryService = {
  getAll: () => fetchApi<Category[]>("/inventory/categories"),
  create: (name: string) => fetchApi<Category>("/inventory/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  }),
  update: (id: number, name: string) => fetchApi<Category>(`/inventory/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  }),
  delete: (id: number) => fetchApi<{ message: string }>(`/inventory/categories/${id}`, {
    method: "DELETE",
  }),
};

export interface SaleDetail {
  id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
}

export interface Sale {
  id: number;
  total_amount: number;
  payment_method: string;
  timestamp: string;
  customer_name?: string;
  customer_dni?: string;
  details: SaleDetail[];
}

export interface Customer {
  id: number;
  dni: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface CustomerStats {
  id: number;
  name: string;
  dni: string;
  total_purchases: number;
  total_spent: number;
}

export const customerService = {
  getAll: () => fetchApi<Customer[]>("/customers"),
  getByDni: (dni: string) => fetchApi<Customer>(`/customers/dni/${dni}`),
  create: (data: Omit<Customer, "id" | "created_at">) => fetchApi<Customer>("/customers", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: number, data: Partial<Omit<Customer, "id" | "created_at">>) => fetchApi<Customer>(`/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  getStats: () => fetchApi<CustomerStats[]>("/customers/stats"),
  getHistory: (id: number) => fetchApi<any[]>(`/customers/${id}/history`),
};

export const salesService = {
  createSale: (data: any) => fetchApi("/sales", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  getAll: (params?: { skip?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.skip) query.set("skip", String(params.skip));
    if (params?.limit) query.set("limit", String(params.limit));
    return fetchApi<Sale[]>(`/sales?${query}`);
  },
  getById: (id: number) => fetchApi<Sale>(`/sales/${id}`),
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

export interface DailySale {
  day: string;
  value: number;
}

export interface SalesByCategory {
  category: string;
  value: number;
}

export interface TopProduct {
  id: number;
  name: string;
  sku: string;
  total_sold: number;
  total_revenue: number;
}

export interface LowStockItem {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
  min_stock: number;
  category: string;
}

export interface RecentActivity {
  id: number;
  type: "Venta" | "Gasto" | "Stock" | "Nómina";
  description: string;
  time_ago: string;
  amount: string;
  color: string;
}

export interface DashboardStats {
  total_sales: number;
  total_expenses: number;
  gross_margin: number;
  active_employees: number;
}

export interface DashboardData {
  stats: DashboardStats;
  daily_sales: DailySale[];
  sales_by_category: SalesByCategory[];
  low_stock: LowStockItem[];
  top_products: TopProduct[];
  recent_activity: RecentActivity[];
}

export const dashboardService = {
  getAll: () => fetchApi<DashboardData>("/dashboard"),
  getStats: () => fetchApi<DashboardStats>("/dashboard/stats"),
  getDailySales: () => fetchApi<DailySale[]>("/dashboard/daily-sales"),
  getSalesByCategory: () => fetchApi<SalesByCategory[]>("/dashboard/sales-by-category"),
  getLowStock: () => fetchApi<LowStockItem[]>("/dashboard/low-stock"),
  getTopProducts: () => fetchApi<TopProduct[]>("/dashboard/top-products"),
  getRecentActivity: () => fetchApi<RecentActivity[]>("/dashboard/recent-activity"),
};
