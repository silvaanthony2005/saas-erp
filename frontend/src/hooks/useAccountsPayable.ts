import { useState, useEffect, useCallback } from 'react';
import {
  accountsPayableService,
  AccountsPayable, PaymentInput, PaymentSchedule, CxPSummary
} from '@/services/businessServices';

export function useAccountsPayable() {
  const [aps, setAps] = useState<AccountsPayable[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [summary, setSummary] = useState<CxPSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * pageSize;
      const result = await accountsPayableService.getAll({ skip, limit: pageSize, status: statusFilter });
      setAps(result.accounts_payable);
      setTotal(result.total);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  const loadSummary = useCallback(async () => {
    try {
      const data = await accountsPayableService.getSummary();
      setSummary(data);
    } catch {}
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => { refresh(); }, [refresh]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const makePayment = useCallback(async (data: PaymentInput) => {
    const payment = await accountsPayableService.makePayment(data);
    refresh();
    loadSummary();
    return payment;
  }, [refresh, loadSummary]);

  const getPayments = useCallback(async (apId: number) => {
    return accountsPayableService.getPayments(apId);
  }, []);

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);

  return {
    aps, total, page, pageSize, totalPages, statusFilter, summary,
    loading, error,
    setStatusFilter, setPage: goToPage, refresh, loadSummary,
    makePayment, getPayments
  };
}
