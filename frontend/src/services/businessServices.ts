import { fetchApi } from "./apiClient";

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  description?: string;
  image_url?: string;
  cost_price_bs: number;
  sale_price_bs: number;
  cost_price_usd: number;
  sale_price_usd: number;
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
  cost_price_usd: number;
  sale_price_usd: number;
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
  unit_price_bs: number;
  unit_price_usd: number;
}

export interface SalePayment {
  id: number;
  payment_method: string;
  amount_bs: number;
  amount_usd?: number;
  reference_number?: string;
  exchange_rate?: number;
  created_at: string;
}

export interface Sale {
  id: number;
  total_amount_bs: number;
  total_usd: number;
  exchange_rate: number;
  payment_method: string;
  timestamp: string;
  customer_name?: string;
  customer_dni?: string;
  customer_category?: string;
  created_by_name?: string;
  details: SaleDetail[];
  payments: SalePayment[];
}

export interface Customer {
  id: number;
  dni: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  category: string;
  credit_limit_usd: number;
  created_at: string;
  created_by_name?: string;
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

export interface Supplier {
  id: number;
  company_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  dni_rif: string;
  is_active: number;
  created_at: string;
}

export interface SupplierInput {
  company_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  dni_rif: string;
}

export interface PaginatedSuppliers {
  suppliers: Supplier[];
  total: number;
  page: number;
  page_size: number;
}

export interface PurchaseDetailInput {
  product_id: number;
  quantity: number;
  unit_cost_bs: number;
}

export interface PurchaseDetail {
  id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_cost_bs: number;
  subtotal_bs: number;
}

export interface PurchaseInput {
  invoice_number: string;
  supplier_id: number;
  subtotal_bs: number;
  tax_bs: number;
  total_bs: number;
  exchange_rate?: number;
  payment_type: string;
  invoice_date?: string;
  due_date?: string;
  notes?: string;
  details: PurchaseDetailInput[];
}

export interface Purchase {
  id: number;
  invoice_number: string;
  supplier_id: number;
  supplier_name?: string;
  subtotal_bs: number;
  tax_bs: number;
  total_bs: number;
  exchange_rate?: number;
  payment_type: string;
  status: string;
  invoice_date?: string;
  due_date?: string;
  notes?: string;
  created_at: string;
  details: PurchaseDetail[];
}

export interface AccountsPayable {
  id: number;
  purchase_invoice_id: number;
  invoice_number?: string;
  supplier_name?: string;
  total_amount_bs: number;
  remaining_balance_bs: number;
  due_date?: string;
  status: string;
  created_at: string;
}

export interface PaymentInput {
  accounts_payable_id: number;
  amount_bs: number;
  payment_date?: string;
  payment_method: string;
  notes?: string;
}

export interface PaymentSchedule {
  id: number;
  accounts_payable_id: number;
  amount_bs: number;
  payment_date?: string;
  payment_method: string;
  notes?: string;
  is_paid: number;
  created_at: string;
}

export interface InventoryMovement {
  id: number;
  product_id: number;
  product_name?: string;
  movement_type: string;
  quantity: number;
  unit_cost_bs: number;
  total_cost_bs: number;
  reference_type: string;
  reference_id?: number;
  created_at: string;
}

export interface CostingConfig {
  method: string;
  updated_at: string;
}

export interface CxPSummary {
  total_pending_bs: number;
  total_overdue_bs: number;
  total_paid_bs: number;
}

export const supplierService = {
  getAll: (params?: { skip?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.skip) query.set("skip", String(params.skip));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.search) query.set("search", params.search);
    return fetchApi<PaginatedSuppliers>(`/suppliers?${query}`);
  },
  getById: (id: number) => fetchApi<Supplier>(`/suppliers/${id}`),
  create: (data: SupplierInput) => fetchApi<Supplier>("/suppliers", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: SupplierInput) => fetchApi<Supplier>(`/suppliers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<{ message: string }>(`/suppliers/${id}`, { method: "DELETE" }),
};

export const purchaseService = {
  getAll: (params?: { skip?: number; limit?: number; supplier_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.skip) query.set("skip", String(params.skip));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.supplier_id) query.set("supplier_id", String(params.supplier_id));
    return fetchApi<{ purchases: Purchase[]; total: number; page: number; page_size: number }>(`/purchases?${query}`);
  },
  getById: (id: number) => fetchApi<Purchase>(`/purchases/${id}`),
  create: (data: PurchaseInput) => fetchApi<Purchase>("/purchases", { method: "POST", body: JSON.stringify(data) }),
  cancel: (id: number) => fetchApi<Purchase>(`/purchases/${id}/cancel`, { method: "POST" }),
};

export const accountsPayableService = {
  getAll: (params?: { skip?: number; limit?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.skip) query.set("skip", String(params.skip));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.status) query.set("status", params.status);
    return fetchApi<{ accounts_payable: AccountsPayable[]; total: number; page: number; page_size: number }>(`/accounts-payable?${query}`);
  },
  getById: (id: number) => fetchApi<AccountsPayable>(`/accounts-payable/${id}`),
  makePayment: (data: PaymentInput) => fetchApi<PaymentSchedule>("/accounts-payable/payments", { method: "POST", body: JSON.stringify(data) }),
  getPayments: (apId: number) => fetchApi<PaymentSchedule[]>(`/accounts-payable/${apId}/payments`),
  getSummary: () => fetchApi<CxPSummary>("/accounts-payable/summary/overview"),
  getSupplierBalance: (supplierId: number) => fetchApi<{ supplier_id: number; total_debt_bs: number; active_aps: number }>(`/accounts-payable/supplier/${supplierId}/balance`),
};

export const costingService = {
  getMethod: () => fetchApi<CostingConfig>("/costing/method"),
  updateMethod: (method: string) => fetchApi<CostingConfig>("/costing/method", { method: "PUT", body: JSON.stringify({ method }) }),
  getKardex: (params?: { product_id?: number; skip?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.product_id) query.set("product_id", String(params.product_id));
    if (params?.skip) query.set("skip", String(params.skip));
    if (params?.limit) query.set("limit", String(params.limit));
    return fetchApi<{ movements: InventoryMovement[]; total: number; page: number; page_size: number }>(`/costing/kardex?${query}`);
  },
};

export interface Receivable {
  id: number;
  sale_id: number;
  customer_id: number;
  customer_name?: string;
  customer_dni?: string;
  total_usd: number;
  remaining_usd: number;
  exchange_rate_at_sale: number;
  status: string;
  due_date?: string;
  created_at: string;
}

export interface ReceivablePayment {
  id: number;
  amount_usd: number;
  amount_bs: number;
  exchange_rate: number;
  payment_method: string;
  reference_number?: string;
  payment_date: string;
}

export interface CxCSummary {
  total_pending_usd: number;
  total_overdue_usd: number;
  total_paid_usd: number;
}

export interface CustomerBalance {
  customer_id: number;
  customer_name: string;
  total_debt_usd: number;
  credit_limit_usd: number;
  available_credit_usd: number;
  active_receivables: number;
}

export interface ReceivableScheduleItem {
  id: number;
  amount_usd: number;
  due_date: string;
  status: string;
  notes?: string;
}

export interface ScheduleInstallmentInput {
  amount_usd: number;
  due_date: string;
  notes?: string;
}

export const receivableService = {
  getAll: (params?: { skip?: number; limit?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.skip) query.set("skip", String(params.skip));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.status) query.set("status", params.status);
    return fetchApi<{ receivables: Receivable[]; total: number }>(`/receivables?${query}`);
  },
  getById: (id: number) => fetchApi<Receivable>(`/receivables/${id}`),
  getPayments: (id: number) => fetchApi<{ payments: ReceivablePayment[]; total: number }>(`/receivables/${id}/payments`),
  makePayment: (id: number, data: { amount_bs: number; payment_method?: string; reference_number?: string }) =>
    fetchApi(`/receivables/${id}/pay`, { method: "POST", body: JSON.stringify(data) }),
  getSummary: () => fetchApi<CxCSummary>("/receivables/summary/all"),
  getCustomerBalance: (customerId: number) => fetchApi<CustomerBalance>(`/receivables/customer/${customerId}/balance`),
  getSchedule: (id: number) => fetchApi<ReceivableScheduleItem[]>(`/receivables/${id}/schedule`),
  setupSchedule: (id: number, data: { installments: ScheduleInstallmentInput[] }) =>
    fetchApi<ReceivableScheduleItem[]>(`/receivables/${id}/schedule`, { method: "POST", body: JSON.stringify(data) }),
};

export { hrService, type Employee, type Payroll, type PayrollProcessData } from './hrService';
export { inventoryService as default };

export interface Expense {
  id: number;
  description: string;
  amount_bs: number;
  category: string;
  timestamp: string;
  created_by_name?: string;
}

export interface Income {
  id: number;
  description: string;
  amount_bs: number;
  category: string;
  timestamp: string;
  entry_type?: string;
}

export interface FinancialSummary {
  total_income_bs: number;
  total_expenses_bs: number;
  net_profit_bs: number;
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
