/**
 * Utilidades para formateo y conversión de moneda (USD/VES)
 */

/**
 * Formatea un número como moneda local (Bolívares)
 */
export const formatBS = (amount: number) => {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'VES',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formatea un número como dólares (USD)
 */
export const formatUSD = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Convierte un monto de USD a BS basado en una tasa
 */
export const convertToBS = (amountInUSD: number, rate: number) => {
  return amountInUSD * rate;
};

/**
 * Convierte un monto de BS a USD basado en una tasa
 */
export const convertToUSD = (amountInBS: number, rate: number) => {
  return rate > 0 ? amountInBS / rate : 0;
};
