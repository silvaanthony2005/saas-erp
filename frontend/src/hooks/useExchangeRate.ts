import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface ExchangeRate {
  rate: number;
  source: string;
  updated_at: string;
  is_stale: boolean;
}

export function useExchangeRate() {
  const [rate, setRate] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  const fetchRate = async () => {
    try {
      const res = await fetch(`${API_BASE}/config/current`);
      if (res.ok) {
        const data: ExchangeRate = await res.json();
        setRate(data.rate);
      }
    } catch (err) {
      console.error('Error fetching rate in hook:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRate();
  }, []);

  return { rate, loading, refreshRate: fetchRate };
}
