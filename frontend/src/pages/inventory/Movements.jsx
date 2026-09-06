import { useEffect, useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { api, formatCOP } from '../../api';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';

const typeOptions = ['ENTRADA', 'SALIDA', 'AJUSTE', 'DEVOLUCION'];

export default function Movements() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ productId: '', variantId: '', type: 'ENTRADA', quantity: 1, reason: '', documentRef: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const m = await api('/inventory/movements?limit=200');
      setMovements(m);
    } finally { setLoading(false); }
  };
  useEffect(() => {
    api('/products?limit=500').then((ps) => setProducts(ps));
    load();
  }, []);

  const onProduct = async (id) => {
    setForm((f) => ({ ...f, productId: id, variantId: '' }));
    if (id) {
      const p = await api(`/products/${id}`);
      setVariants(p.variants);
    } else setVariants([]);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.productId || !form.quantity) return setError('Seleccione producto y cantidad');
    setError(''); setSaving(true);
    try {
      await api('/inventory/movements', { method: 'POST', body: form });
      setSuccess('Movimiento registrado correctamente.');
      setForm({ productId: '', variantId: '', type: 'ENTRADA', quantity: 1, reason: '', documentRef: '' });
      setVariants([]);
      setShowForm(false);
      await load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Movimientos de inventario</h1>
          <p className="text-sm text-gray-500">Entradas, salidas y ajustes</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          <Plus size={18} /> Registrar movimiento
        </button>
      </div>

      {success && <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{success}</div>}

      {showForm && (
        <form onSubmit={submit} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Nuevo movimiento</h2>
          {error && <div className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Producto *</label>
              <select value={form.productId} onChange={(e) => onProduct(e.target.value)} className="input w-full" required>
                <option value="">Seleccione…</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.reference || p.code})</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Variante</label>
              <select value={form.variantId} onChange={(e) => setForm((f) => ({ ...f, variantId: e.target.value }))} className="input w-full">
                <option value="">Todas / sin variante</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>{v.color || 'Sin color'} · {v.size || 'Sin talla'} (stock: {v.stock})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tipo *</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="input w-full">
                {typeOptions.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Cantidad *</label>
              <input type="number" min={1} value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} className="input w-full" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Documento</label>
              <input value={form.documentRef} onChange={(e) => setForm((f) => ({ ...f, documentRef: e.target.value }))} className="input w-full" placeholder="Ej: OC-001" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Motivo / observaciones</label>
              <input value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} className="input w-full" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            {saving ? 'Registrando…' : 'Registrar'} {form.type === 'SALIDA' && <span className="ml-1 text-xs opacity-80">(descuenta stock)</span>}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Variante</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">Cantidad</th>
                <th className="px-4 py-3 text-right">Costo</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Motivo</th>
                <th className="px-4 py-3">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movements.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500"><Spinner /></td></tr>
              ) : movements.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{new Date(m.date).toLocaleDateString('es-CO')}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{m.productName}</td>
                  <td className="px-4 py-3 text-gray-600">{m.variantLabel || '—'}</td>
                  <td className="px-4 py-3"><Badge color={m.type === 'SALIDA' ? 'red' : m.type === 'ENTRADA' ? 'green' : 'blue'}>{m.type}</Badge></td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{m.type === 'SALIDA' ? '-' : '+'}{m.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatCOP(m.cost)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{m.documentRef || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{m.reason || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{m.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}