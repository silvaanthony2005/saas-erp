'use client';

import { useState, useEffect } from 'react';

interface ExchangeRate {
  rate: number;
  source: string;
  updated_at: string;
  is_stale: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function ExchangeRateModal() {
  const [rateData, setRateData] = useState<ExchangeRate | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [manualRate, setManualRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRate = async () => {
    try {
      const res = await fetch(`${API_BASE}/config/current`);
      if (res.ok) {
        const data = await res.json();
        setRateData(data);
        if (data.is_stale) {
            setIsOpen(true);
        }
      } else {
        setIsOpen(true);
      }
    } catch (err) {
      console.error('Error fetching rate:', err);
      setIsOpen(true);
    }
  };

  useEffect(() => {
    fetchRate();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_BASE}/config/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate: parseFloat(manualRate) }),
      });

      if (res.ok) {
        setIsOpen(false);
        fetchRate();
      } else {
        setError('Error al actualizar la tasa. Intente de nuevo.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-2xl max-w-md w-full border border-red-500">
        <h2 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">
          ⚠️ Tasa de Cambio Requerida
        </h2>
        <p className="mb-6 text-slate-600 dark:text-slate-300">
          No se pudo sincronizar la tasa oficial del BCV automáticamente o la tasa actual ha expirado. 
          Por favor, ingrese la tasa del día manualmente para continuar operando.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Precio del Dólar (Bs.)</label>
            <input
              type="number"
              step="0.01"
              value={manualRate}
              onChange={(e) => setManualRate(e.target.value)}
              className="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ej: 36.50"
              required
            />
          </div>
          
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Establecer Tasa y Continuar'}
          </button>
        </form>
        
        <p className="mt-4 text-xs text-slate-500 text-center">
          Esta acción es obligatoria para cumplir con la normativa legal de facturación en Bolívares.
        </p>
      </div>
    </div>
  );
}
