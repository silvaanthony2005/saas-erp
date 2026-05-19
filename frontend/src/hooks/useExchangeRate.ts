import { useState, useEffect } from 'react';

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
      const res = await fetch('http://localhost:8000/api/v1/config/current');
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
