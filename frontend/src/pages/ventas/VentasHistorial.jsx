import { useState } from 'react';
import { Search, FileText, Eye } from 'lucide-react';
import { Card, Button, Modal, Table, Select } from '../../components/ui';
import { useResource, fmt, fmtDate } from '../../hooks/useResource';
import { mockVentas, mockVentaDetalle } from '../../mockData';
import Badge from '../../components/Badge';

const estadoColor = (e) => (e === 'FAC' ? 'blue' : e === 'COT' ? 'amber' : e === 'PED' ? 'gray' : 'green');

export default function VentasHistorial() {
  const { data: ventas } = useResource('/sales', mockVentas);
  const [q, setQ] = useState('');
  const [metodo, setMetodo] = useState('');
  const [detalle, setDetalle] = useState(null);

  const filtered = (ventas || []).filter((v) =>
    (!metodo || v.metodo === metodo) &&
    (!q || v.id.toString().includes(q) || (v.cliente || '').toLowerCase().includes(q.toLowerCase())));

  const total = filtered.reduce((s, v) => s + v.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ventas</h1>
          <p className="text-sm text-gray-500">Historial de facturas, cotizaciones y pedidos</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-2 shadow-sm">
          <span className="text-sm text-gray-500">Total filtrado:</span>
          <span className="text-lg font-bold text-gray-900">{fmt(total)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por N° de venta o cliente…" className="input w-full pl-9" />
        </div>
        <Select value={metodo} onChange={(e) => setMetodo(e.target.value)} className="!w-auto">
          <option value="">Todos los métodos</option>
          {['Efectivo', 'Nequi', 'Transferencia', 'Bancolombia', 'Tarjeta débito', 'Tarjeta crédito', 'Crédito', 'Daviplata'].map((m) => <option key={m}>{m}</option>)}
        </Select>
      </div>

      <Card>
        <Table
          headers={['N°', 'Fecha', 'Cliente', 'Vendedor', 'Método', 'Detalle', 'Total', 'Tipo', '']}
          rows={(filtered || []).map((v) => (
            <tr key={v.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs font-semibold text-brand-600">{v.tipo}-{v.id}</td>
              <td className="px-4 py-3 text-gray-600">{fmtDate(v.fecha)}</td>
              <td className="px-4 py-3 font-medium text-gray-800">{v.cliente}</td>
              <td className="px-4 py-3 text-gray-600">{v.vendedor}</td>
              <td className="px-4 py-3 text-gray-600">{v.metodo}</td>
              <td className="px-4 py-3 max-w-xs truncate text-gray-500">{v.detalle || (typeof v.items === 'string' ? v.items : '')}</td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(v.total)}</td>
              <td className="px-4 py-3"><Badge color={estadoColor(v.tipo)}>{v.tipo}</Badge></td>
              <td className="px-4 py-3"><Button variant="ghost" size="sm" onClick={() => setDetalle(v)}><Eye size={15} /></Button></td>
            </tr>
          ))}
        />
      </Card>

      <Modal open={!!detalle} onClose={() => setDetalle(null)} title={`Venta ${detalle ? `${detalle.tipo}-${detalle.id}` : ''}`}>
        {detalle && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-gray-500">Cliente</p><p className="font-medium">{detalle.cliente}</p></div>
              <div><p className="text-gray-500">Fecha</p><p className="font-medium">{fmtDate(detalle.fecha)}</p></div>
              <div><p className="text-gray-500">Vendedor</p><p className="font-medium">{detalle.vendedor}</p></div>
              <div><p className="text-gray-500">Método</p><p className="font-medium">{detalle.metodo}</p></div>
            </div>
            <Table
              headers={['Producto', 'Talla', 'Color', 'Qty', 'Precio', 'Desc.', 'Total']}
              rows={(Array.isArray(detalle.items) && detalle.items.length ? detalle.items : mockVentaDetalle).map((i, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2.5 text-gray-800">{i.producto}</td>
                  <td className="px-4 py-2.5 text-gray-600">{i.talla}</td>
                  <td className="px-4 py-2.5 text-gray-600">{i.color}</td>
                  <td className="px-4 py-2.5 text-right text-gray-800">{i.cantidad}</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">{fmt(i.precio)}</td>
                  <td className="px-4 py-2.5 text-right text-amber-600">{i.descuento ? `-${fmt(i.descuento)}` : '—'}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{fmt(i.total)}</td>
                </tr>
              ))}
            />
            <div className="flex justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm">
              <span className="font-medium text-gray-600">Total</span>
              <span className="text-lg font-bold">{fmt(detalle.total)}</span>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary"><FileText size={15} /> Reimprimir</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}