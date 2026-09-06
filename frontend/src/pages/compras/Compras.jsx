import { useState } from 'react';
import { Plus, Search, Truck, CheckCircle2 } from 'lucide-react';
import { Card, Button, Modal, Table, Input, Select } from '../../components/ui';
import { useResource, fmt, fmtDate } from '../../hooks/useResource';
import { api } from '../../api';
import { mockCompras, mockProveedores } from '../../mockData';
import Badge from '../../components/Badge';

const estadoLabel = (e) => ({ recibida: 'Recibida', pagada: 'Pagada', pendiente: 'Pendiente', anulada: 'Anulada' }[e?.toLowerCase()] || e?.charAt(0).toUpperCase() + e?.slice(1) || e);

export default function Compras() {
  const { data: compras } = useResource('/purchases', mockCompras);
  const proveedores = mockProveedores;
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('');
  const [creating, setCreating] = useState(false);
  const [proveedor, setProveedor] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [pago, setPago] = useState('crédito');
  const [lines, setLines] = useState([{ descripcion: '', qty: 1, costo: 0, iva: 0 }]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const filtered = (compras || []).filter((c) =>
    (!estado || c.estado.toLowerCase() === estado.toLowerCase()) &&
    (!q || (c.numero || c.id).toString().includes(q) || c.proveedor.toLowerCase().includes(q.toLowerCase())));

  const subtotal = lines.reduce((s, l) => s + l.qty * l.costo, 0);
  const ivaTotal = lines.reduce((s, l) => s + l.qty * l.costo * (l.iva / 100), 0);

  const setLine = (i, k, val) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: val } : l)));
  const addLine = () => setLines((ls) => [...ls, { descripcion: '', qty: 1, costo: 0, iva: 0 }]);

  const confirmar = async () => {
    setSaving(true);
    setErr('');
    try {
      await api('/purchases', {
        method: 'POST',
        body: {
          proveedorId: Number(proveedor),
          fecha,
          condicionPago: pago,
          lines: lines.map((l) => ({ descripcion: l.descripcion, qty: Number(l.qty), costo: Number(l.costo), iva: Number(l.iva) })),
        },
      });
      setCreating(false);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Órdenes de compra</h1>
          <p className="text-sm text-gray-500">Registro de órdenes y compras a proveedores</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus size={16} /> Nueva orden de compra</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar orden o proveedor…" className="input w-full pl-9" />
        </div>
        <Select value={estado} onChange={(e) => setEstado(e.target.value)} className="!w-auto">
          <option value="">Todos los estados</option>
          <option>Pendiente</option><option>Recibida</option><option>Pagada</option><option>Anulada</option>
        </Select>
      </div>

      <Card>
        <Table
          headers={['Orden', 'Proveedor', 'Fecha', 'Ítems', 'Total', 'Estado', '']}
          rows={filtered.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs font-semibold text-brand-600">{c.numero || c.id}</td>
              <td className="px-4 py-3 font-medium text-gray-800">{c.proveedor}</td>
              <td className="px-4 py-3 text-gray-600">{fmtDate(c.fecha)}</td>
              <td className="px-4 py-3 max-w-xs truncate text-xs text-gray-500">{c.items}</td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(c.total)}</td>
              <td className="px-4 py-3"><Badge color={estadoLabel(c.estado) === 'Pagada' ? 'green' : estadoLabel(c.estado) === 'Recibida' ? 'blue' : estadoLabel(c.estado) === 'Pendiente' ? 'amber' : 'gray'}>{estadoLabel(c.estado)}</Badge></td>
              <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm"><Truck size={15} /></Button></td>
            </tr>
          ))}
        />
      </Card>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva orden de compra" wide>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Select label="Proveedor *" value={proveedor} onChange={(e) => setProveedor(e.target.value)}>
              <option value="">Seleccione…</option>
              {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </Select>
            <Input label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            <Select label="Condición de pago" value={pago} onChange={(e) => setPago(e.target.value)}>
              <option value="crédito">Crédito (cuenta por pagar)</option>
              <option value="contado">Contado (sale de caja/banco)</option>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500">
                <tr><th className="px-2 py-2">Producto / referencia</th><th className="px-2 py-2 w-20 text-right">Cant.</th><th className="px-2 py-2 w-28 text-right">Costo</th><th className="px-2 py-2 w-24 text-right">IVA %</th><th className="px-2 py-2 w-28 text-right">Total</th></tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1.5"><input value={l.descripcion} onChange={(e) => setLine(i, 'descripcion', e.target.value)} className="input w-full" placeholder="Camiseta DryFit ×L · Negro" /></td>
                    <td className="px-2 py-1.5"><input type="number" min={1} value={l.qty} onChange={(e) => setLine(i, 'qty', e.target.value)} className="input w-full text-right" /></td>
                    <td className="px-2 py-1.5"><input type="number" min={0} value={l.costo} onChange={(e) => setLine(i, 'costo', e.target.value)} className="input w-full text-right" /></td>
                    <td className="px-2 py-1.5"><input type="number" min={0} value={l.iva} onChange={(e) => setLine(i, 'iva', e.target.value)} className="input w-full text-right" /></td>
                    <td className="px-2 py-1.5 text-right font-semibold text-gray-800">{fmt(l.qty * l.costo * (1 + l.iva / 100))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between">
            <Button variant="secondary" size="sm" onClick={addLine}><Plus size={15} /> Agregar línea</Button>
            <div className="text-sm">
              <p className="flex justify-between gap-6 text-gray-500"><span>Subtotal</span><span>{fmt(subtotal)}</span></p>
              <p className="flex justify-between gap-6 text-gray-500"><span>IVA total</span><span>{fmt(ivaTotal)}</span></p>
              <p className="mt-1 flex justify-between gap-6 text-base font-bold"><span>Total</span><span>{fmt(subtotal + ivaTotal)}</span></p>
            </div>
          </div>
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
            Al confirmar: sube inventario, actualiza costo promedio, genera cuenta por pagar (crédito) o movimiento financiero (contado) y registra auditoría.
          </p>
          {err && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{err}</div>}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setCreating(false)}>Cancelar</Button>
            <Button className="flex-1" disabled={!proveedor || lines.length === 0 || subtotal === 0 || saving} onClick={confirmar}><CheckCircle2 size={16} /> {saving ? 'Guardando…' : 'Confirmar compra'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}