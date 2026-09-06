import { useState } from 'react';
import { Plus, Search, Receipt } from 'lucide-react';
import { Card, Button, Modal, Table, Input, Select } from '../../components/ui';
import { useResource, fmt, fmtDate } from '../../hooks/useResource';
import { api } from '../../api';
import { mockGastos } from '../../mockData';
import Badge from '../../components/Badge';

const categorias = ['Arriendo', 'Servicios públicos', 'Internet', 'Nómina', 'Transporte', 'Publicidad', 'Empaque', 'Mantenimiento', 'Impuestos', 'Comisiones', 'Otros'];

export default function Gastos() {
  const { data: gastos } = useResource('/expenses', mockGastos);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [creating, setCreating] = useState(false);
  const [gf, setGf] = useState({ fecha: new Date().toISOString().slice(0, 10), categoria: 'Arriendo', descripcion: '', valor: '', metodo: 'Efectivo', comprobante: '' });
  const [savingG, setSavingG] = useState(false);
  const [gErr, setGErr] = useState('');

  // El endpoint /expenses devuelve { gastos: [...], total }; los mocks llegan como array
  const list = Array.isArray(gastos) ? gastos : (gastos?.gastos || []);
  const filtered = list.filter((g) => (!cat || g.categoria === cat) && (!q || (g.descripcion || '').toLowerCase().includes(q.toLowerCase())));
  const total = filtered.reduce((s, g) => s + g.valor, 0);

  const guardar = async () => {
    setSavingG(true);
    setGErr('');
    try {
      await api('/expenses', {
        method: 'POST',
        body: { fecha: gf.fecha, categoria: gf.categoria, descripcion: gf.descripcion, valor: Number(gf.valor), metodo: gf.metodo, comprobante: gf.comprobante },
      });
      setCreating(false);
    } catch (e) {
      setGErr(e.message);
    } finally {
      setSavingG(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Gastos</h1>
          <p className="text-sm text-gray-500">Registro de gastos operativos por categoría</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus size={16} /> Nuevo gasto</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600"><Receipt size={20} /></span>
          <p className="text-xs text-gray-500">Gastos este mes</p>
          <p className="text-xl font-bold text-red-600">{fmt(total)}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Total gastos</p>
          <p className="text-xl font-bold text-gray-900">{fmt(total)}</p>
          <p className="mt-1 text-xs text-gray-400">{filtered.length} registros</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar gasto…" className="input w-full pl-9" />
        </div>
        <Select value={cat} onChange={(e) => setCat(e.target.value)} className="!w-auto">
          <option value="">Todas las categorías</option>
          {categorias.map((c) => <option key={c}>{c}</option>)}
        </Select>
      </div>

      <Card>
        <Table
          headers={['Fecha', 'Categoría', 'Descripción', 'Método', 'Comprobante', 'Valor']}
          rows={filtered.map((g) => (
            <tr key={g.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-600">{fmtDate(g.fecha)}</td>
              <td className="px-4 py-3"><Badge color="red">{g.categoria}</Badge></td>
              <td className="px-4 py-3 text-gray-800">{g.descripcion}</td>
              <td className="px-4 py-3 text-gray-600">{g.metodo}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-600">{g.comprobante}</td>
              <td className="px-4 py-3 text-right font-semibold text-red-600">-{fmt(g.valor)}</td>
            </tr>
          ))}
        />
      </Card>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nuevo gasto">
        <div className="space-y-4">
          <Input label="Fecha" type="date" value={gf.fecha} onChange={(e) => setGf({ ...gf, fecha: e.target.value })} />
          <Select label="Categoría" value={gf.categoria} onChange={(e) => setGf({ ...gf, categoria: e.target.value })}>{categorias.map((c) => <option key={c}>{c}</option>)}</Select>
          <Input label="Descripción" placeholder="Detalle del gasto" value={gf.descripcion} onChange={(e) => setGf({ ...gf, descripcion: e.target.value })} />
          <Input label="Valor" type="number" value={gf.valor} onChange={(e) => setGf({ ...gf, valor: e.target.value })} />
          <Select label="Método de pago" value={gf.metodo} onChange={(e) => setGf({ ...gf, metodo: e.target.value })}><option>Efectivo</option><option>Transferencia</option><option>Nequi</option><option>Tarjeta débito</option><option>Tarjeta crédito</option><option>PSE</option></Select>
          <Input label="Comprobante / documento" value={gf.comprobante} onChange={(e) => setGf({ ...gf, comprobante: e.target.value })} />
          {gErr && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{gErr}</div>}
          <div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setCreating(false)}>Cancelar</Button><Button className="flex-1" disabled={savingG || !gf.descripcion || !Number(gf.valor)} onClick={guardar}>{savingG ? 'Guardando…' : 'Guardar'}</Button></div>
        </div>
      </Modal>
    </div>
  );
}