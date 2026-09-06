import { useEffect, useState } from 'react';
import { api, formatCOP } from '../../api';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';

export default function Kardex() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState('');
  const [kardex, setKardex] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api('/products').then(setProducts); }, []);

  useEffect(() => {
    if (!selected) { setKardex(null); return; }
    setLoading(true);
    api(`/inventory/kardex/${selected}`)
      .then(setKardex)
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Kardex</h1>
        <p className="text-sm text-gray-500">Existencia, costo promedio y movimiento acumulado por producto</p>
      </div>

      <div className="max-w-xl">
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="input w-full">
          <option value="">Seleccione un producto…</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.reference || p.code}</option>)}
        </select>
      </div>

      {!selected && <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">Seleccione un producto para consultar su Kardex.</p>}

      {kardex && (
        <div className="space-y-4">
          {/* Resumen */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-gray-500">Producto</p>
              <p className="mt-1 font-semibold text-gray-900">{kardex.product.name}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-gray-500">Existencia</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{kardex.totalStock} und</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-gray-500">Costo promedio</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{formatCOP(kardex.product.avgCost)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-gray-500">Valor inventario</p>
              <p className="mt-1 text-xl font-bold text-brand-600">{formatCOP(kardex.inventoryValue)}</p>
            </div>
          </div>

          {kardex.variants.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Existencias por variante</h3>
              <div className="flex flex-wrap gap-2">
                {kardex.variants.map((v) => (
                  <span key={v.id} className={`rounded-lg px-3 py-1.5 text-sm ${v.stock <= 0 ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                    {v.label || 'Sin talla/color'} · <b>{v.stock}</b>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tabla Kardex */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Documento</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3 text-right">Entrada</th>
                    <th className="px-4 py-3 text-right">Salida</th>
                    <th className="px-4 py-3 text-right">Saldo</th>
                    <th className="px-4 py-3 text-right">Costo</th>
                    <th className="px-4 py-3">Usuario</th>
                    <th className="px-4 py-3">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {kardex.kardex.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-600">{new Date(m.date).toLocaleDateString('es-CO')}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{m.document}</td>
                      <td className="px-4 py-2.5"><Badge color={m.type === 'SALIDA' ? 'red' : 'green'}>{m.type}</Badge></td>
                      <td className="px-4 py-2.5 text-right text-green-600">{m.entrada || ''}</td>
                      <td className="px-4 py-2.5 text-right text-red-600">{m.salida ? `-${m.salida}` : ''}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{m.saldo}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{formatCOP(m.cost)}</td>
                      <td className="px-4 py-2.5 text-gray-600">{m.user}</td>
                      <td className="px-4 py-2.5 text-gray-600">{m.reason || '—'}</td>
                    </tr>
                  ))}
                  {kardex.kardex.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">Sin movimientos registrados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {loading && <Spinner />}
    </div>
  );
}