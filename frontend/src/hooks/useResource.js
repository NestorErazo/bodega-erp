import { useEffect, useState } from 'react';
import { api } from '../api';

// Hook que intenta la API; si el endpoint aún no existe (backend en desarrollo),
// usa datos de demostración del frontend.
export function useResource(path, mockData, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api(path)
      .then((d) => alive && setData(d))
      .catch(() => alive && setData(mockData))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, deps);

  return { data, loading, error };
}

export const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

// Formatea fechas que pueden llegar como Date, string ISO, timestamp o nulo.
export const fmtDate = (d) => {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-CO');
};