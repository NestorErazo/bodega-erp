import { useState } from 'react';
import { Undo2, Search } from 'lucide-react';
import { Card, Button, Modal, Table, Select, Input } from '../../components/ui';
import { useResource, fmt, fmtDate } from '../../hooks/useResource';
import { api } from '../../api';
import { mockVentas } from '../../mockData';
import Badge from '../../components/Badge';

export default function Devoluciones() {
  const { data: ventas } = useResource('/sales', mockVentas);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [motivo, setMotivo] = useState('Error del cliente');
  const [reingresar, setReingresar] = useState(true);
  const [items, setItems] = useState([]);
  const [hecha, setHecha] = useState(false);
  const [savingDev, setSavingDev] = useState(false);
  const [devError, setDevError] = useState('');

  const filtered = (ventas || []).filter((v) => !q || v.id.toString().includes(q) || (v.cliente || '').toLowerCase().includes(q.toLowerCase()));
  const totalDev = items.reduce((s, i) => s + i.cantidad * i.total, 0);

  const open = (v) => {
    setSelected(v);
    const d = v.detalle || (typeof v.items === 'string' ? v.items : '');
    setItems(v ? [{ nombre: d.split('·')[0]?.split('×')[1]?.trim() || 'Producto', cantidad: 1, total: v.total, reingresar: true }] : []);
    setHecha(false);
    setDevError('');
  };

  const generar = async () => {
    setSavingDev(true);
    setDevError('');
    try {
      await api('/refunds', {
        method: 'POST',
        body: { saleId: selected.id, motivo, reingresar, items: items.map((i) => ({ cantidad: i.cantidad, total: i.total })) },
      });
      setHecha(true);
    } catch (err) {
      setDevError(err.message);
    } finally {
      setSavingDev(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Devoluciones</h1>
        <p className="text-sm text-gray-500">Busque una venta para generar devolución a cliente</p>
      </div>

      <div className="relative max-w-xl">
        <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar venta por N° o cliente…" className="input w-full pl-9" />
      </div>

      <Card>
        <Table
          headers={['N° venta', 'Fecha', 'Cliente', 'Total', 'Estado', '']}
          rows={filtered.map((v) => (
            <tr key={v.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs font-semibold text-brand-600">FAC-{v.id}</td>
              <td className="px-4 py-3 text-gray-600">{fmtDate(v.fecha)}</td>
              <td className="px-4 py-3 font-medium text-gray-800">{v.cliente}</td>
              <td className="px-4 py-3 text-right font-semibold">{fmt(v.total)}</td>
              <td className="px-4 py-3"><Badge color="green">Vigente</Badge></td>
              <td className="px-4 py-3 text-right"><Button variant="secondary" size="sm" onClick={() => open(v)}><Undo2 size={14} /> Devolver</Button></td>
            </tr>
          ))}
        />
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Devolución · FAC-${selected?.id}`}>
        {selected && !hecha ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Cliente: <b>{selected.cliente}</b> · {fmtDate(selected.fecha)}</p>
            <div className="space-y-2">
              {items.map((i, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{i.nombre}</p>
                    <div className="mt-1 flex items-center gap-3">
                      <label className="flex items-center gap-1 text-xs text-gray-500"><input type="checkbox" checked={i.reingresar} onChange={(e) => setItems((it) => it.map((x, j) => j === idx ? { ...x, reingresar: e.target.checked } : x))} /> Reingresa a inventario</label>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Cant</span>
                    <input type="number" min={1} max={typeof selected.items === 'string' ? selected.items.split('·')[0]?.match(/\d+/)?.[0] || 10 : (Array.isArray(selected.items) ? selected.items[0]?.cantidad || 10 : 10)} value={i.cantidad}
                      onChange={(e) => setItems((it) => it.map((x, j) => j === idx ? { ...x, cantidad: Number(e.target.value) } : x))}
                      className="input w-16 text-center" />
                    <span className="text-sm font-semibold text-gray-800">{fmt(i.total * i.cantidad)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <span className="mb-1 block text-sm font-medium text-gray-700">Motivo</span>
              <Select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                <option>Error del cliente</option><option>Producto defectuoso</option><option>Talla/color equivocado</option>
                <option>Cambio de opinión</option><option>Garantía</option><option>Otro</option>
              </Select>
            </div>
            <div className="flex justify-between rounded-lg bg-red-50 px-4 py-3">
              <span className="font-medium text-red-700">Total a devolver</span>
              <span className="text-lg font-bold text-red-700">-{fmt(totalDev)}</span>
            </div>
            {devError && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{devError}</div>}
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setSelected(null)}>Cancelar</Button>
              <Button variant="danger" className="flex-1" disabled={savingDev} onClick={generar}>
                {savingDev ? 'Registrando…' : 'Generar devolución'}
              </Button>
            </div>
          </div>
        ) : hecha && selected ? (
          <div className="space-y-4 text-center">
            <div className="text-4xl">✅</div>
            <p className="text-sm text-gray-600">Devolución registrada por <b>{fmt(totalDev)}</b> sobre la venta <b>FAC-{selected.id}</b>.</p>
            <p className="text-xs text-gray-400">{reingresar ? 'Los productos vuelven a inventario' : 'Productos fuera de inventario'} · Motivo: {motivo}.</p>
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
              La caja, el kardex y las estadísticas del dashboard se ajustan según el resultado del servidor.
            </div>
            <Button className="w-full" onClick={() => setSelected(null)}>Entendido</Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}