import { useState, useEffect } from 'react';
import { hrService, Employee, Payroll, PayrollProcessData } from '@/services/businessServices';

interface UseHRError {
  employees: string | null;
  payroll: string | null;
}

export function useHR() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingPayroll, setLoadingPayroll] = useState(true);
  const [error, setError] = useState<UseHRError>({ employees: null, payroll: null });
  const [submitting, setSubmitting] = useState(false);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const data = await hrService.getEmployees();
      setEmployees(data);
      setError(prev => ({ ...prev, employees: null }));
    } catch (err: any) {
      setError(prev => ({ ...prev, employees: err.message }));
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchPayrolls = async () => {
    setLoadingPayroll(true);
    try {
      const data = await hrService.getPayrolls();
      setPayrolls(data);
      setError(prev => ({ ...prev, payroll: null }));
    } catch (err: any) {
      setError(prev => ({ ...prev, payroll: err.message }));
    } finally {
      setLoadingPayroll(false);
    }
  };

  const createEmployee = async (data: Omit<Employee, 'id' | 'is_active'>) => {
    setSubmitting(true);
    try {
      await hrService.createEmployee(data);
      await fetchEmployees();
      return true;
    } catch (err: any) {
      setError(prev => ({ ...prev, employees: err.message }));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const updateEmployee = async (id: number, data: Partial<Employee>) => {
    setSubmitting(true);
    try {
      await hrService.updateEmployee(id, data);
      await fetchEmployees();
      return true;
    } catch (err: any) {
      setError(prev => ({ ...prev, employees: err.message }));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteEmployee = async (id: number) => {
    setSubmitting(true);
    try {
      await hrService.deleteEmployee(id);
      await fetchEmployees();
      return true;
    } catch (err: any) {
      setError(prev => ({ ...prev, employees: err.message }));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const processPayroll = async (data: PayrollProcessData) => {
    setSubmitting(true);
    try {
      const result = await hrService.processPayroll(data);
      await fetchPayrolls();
      return result;
    } catch (err: any) {
      setError(prev => ({ ...prev, payroll: err.message }));
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchPayrolls();
  }, []);

  return {
    employees,
    payrolls,
    loadingEmployees,
    loadingPayroll,
    error,
    submitting,
    refreshEmployees: fetchEmployees,
    refreshPayrolls: fetchPayrolls,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    processPayroll,
  };
}
