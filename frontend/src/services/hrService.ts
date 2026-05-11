import { fetchApi } from "./apiClient";

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position: string;
  base_salary: number;
  hire_date: string;
  is_active: boolean;
}

export interface Payroll {
  id: number;
  employee_id: number;
  employee_name?: string;
  pay_period_start: string;
  pay_period_end: string;
  gross_salary: number;
  deductions: number;
  net_salary: number;
  payment_date: string;
  status: 'paid' | 'pending';
}

export interface PayrollProcessData {
  employee_id: number;
  pay_period_start: string;
  pay_period_end: string;
  deductions: number;
}

export const hrService = {
  getEmployees: () => fetchApi<Employee[]>("/hr/employees"),

  getPayrolls: () => fetchApi<Payroll[]>("/hr/payrolls"),

  createEmployee: (data: Omit<Employee, 'id' | 'is_active'>) =>
    fetchApi<Employee>("/hr/employees", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateEmployee: (id: number, data: Partial<Employee>) =>
    fetchApi<Employee>(`/hr/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteEmployee: (id: number) =>
    fetchApi(`/hr/employees/${id}`, {
      method: "DELETE",
    }),

  processPayroll: (data: PayrollProcessData) =>
    fetchApi<Payroll>("/hr/payroll", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
