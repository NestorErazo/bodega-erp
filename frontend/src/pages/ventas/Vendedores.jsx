import { useState } from 'react';
import { Plus, Search, Pencil, Percent } from 'lucide-react';
import { Card, Button, Modal, Table, Input } from '../../components/ui';
import { useResource, fmt } from '../../hooks/useResource';
import { api } from '../../api';
import { mockVendedores } from '../../mockData';
import Badge from '../../components/Badge';

export default function Vendedores() {
  const { data: vendedores } = useResource('/salespersons', mockVendedores);
  const [creating, setCreating] = useState(false);
  const [vf, setVf] = useState({ nombre: '', documento: '', telefono: '', comision: '' });
  const [savingV, setSavingV] = useState(false);
  const [vErr, setVErr] = useState('');

  const totalComisiones = (vendedores || []).reduce((s, v) => s + v.comisionGenerada, 0);

  const guardar = async () => {
    setSavingV(true);
    setVErr('');
    try {
      await api('/salespersons', {
        method: 'POST',
        body: { nombre: vf.nombre, documento: vf.documento, telefono: vf.telefono, comision: Number(vf.comision) || 0 },
      });
      setCreating(false);
    } catch (e) {
      setVErr(e.message);
    } finally {
      setSavingV(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vendedores y comisiones</h1>
          <p className="text-sm text-gray-500">Ventas, comisiones generadas y metas por vendedor</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus size={16} /> Nuevo vendedor</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Pencil size={20} /></span>
          <p className="text-xs text-gray-500">Vendedores activos</p>
          <p className="text-xl font-bold text-gray-900">{(vendedores || []).filter((v) => v.estado === 'Activo').length}</p>
        </Card>
        <Card>
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600"><Percent size={20} /></span>
          <p className="text-xs text-gray-500">Comisiones del mes</p>
          <p className="text-xl font-bold text-green-600">{fmt(totalComisiones)}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Ventas del mes</p>
          <p className="text-xl font-bold text-gray-900">{fmt((vendedores || []).reduce((s, v) => s + v.ventasMes, 0))}</p>
        </Card>
      </div>

      <Card>
        <Table
          headers={['Vendedor', 'Documento', 'Comisión', 'Ventas del mes', 'Comisión generada', 'Estado']}
          rows={(vendedores || []).map((v) => (
            <tr key={v.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <p className="font-semibold text-gray-800">{v.nombre}</p>
                <p className="text-xs text-gray-400">{v.telefono}</p>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-gray-600">{v.documento}</td>
              <td className="px-4 py-3">
                <Badge color="blue">{v.comision}%</Badge>
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(v.ventasMes)}</td>
              <td className="px-4 py-3 text-right text-green-700">{fmt(v.comisionGenerada)}</td>
              <td className="px-4 py-3"><Badge color={v.estado === 'Activo' ? 'green' : 'gray'}>{v.estado}</Badge></td>
            </tr>
          ))}
        />
      </Card>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nuevo vendedor">
        <div className="space-y-4">
          <Input label="Nombre completo" value={vf.nombre} onChange={(e) => setVf({ ...vf, nombre: e.target.value })} />
          <Input label="Documento" value={vf.documento} onChange={(e) => setVf({ ...vf, documento: e.target.value })} />
          <Input label="Teléfono" value={vf.telefono} onChange={(e) => setVf({ ...vf, telefono: e.target.value })} />
          <Input label="% Comisión" type="number" placeholder="3" value={vf.comision} onChange={(e) => setVf({ ...vf, comision: e.target.value })} />
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
            La comisión puede configurarse por venta, por producto, por categoría o por meta. Se calcula sobre el valor facturado.
          </p>
          {vErr && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{vErr}</div>}
          <div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setCreating(false)}>Cancelar</Button><Button className="flex-1" disabled={savingV || !vf.nombre} onClick={guardar}>{savingV ? 'Guardando…' : 'Guardar'}</Button></div>
        </div>
      </Modal>
    </div>
  );
}