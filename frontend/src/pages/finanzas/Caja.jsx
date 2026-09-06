import { useState } from 'react';
import { Play, Square, Banknote, ArrowDownCircle, ArrowUpCircle, Calculator, Sparkles } from 'lucide-react';
import { Card, Button, Modal, Input, Select, Table } from '../../components/ui';
import { useResource, fmt } from '../../hooks/useResource';
import { api } from '../../api';
import { mockCaja } from '../../mockData';
import Badge from '../../components/Badge';

export default function Caja() {
  const { data } = useResource('/cash/state', mockCaja);
  const [modal, setModal] = useState(null); // 'apertura' | 'arqueo' | 'movimiento'
  const [movType, setMovType] = useState('ingreso');
  const [cant, setCant] = useState(0);
  const [conc, setConc] = useState('');
  const [val, setVal] = useState('');
  const [medio, setMedio] = useState('Efectivo');
  const [contado, setContado] = useState('');
  const [czSaving, setCzSaving] = useState(false);
  const [czErr, setCzErr] = useState('');

  const call = async (fn) => {
    setCzSaving(true);
    setCzErr('');
    try {
      await fn();
    } catch (e) {
      setCzErr(e.message);
    } finally {
      setCzSaving(false);
    }
  };

  const abrir = () => call(async () => { await api('/cash/open', { method: 'POST', body: { openingAmount: Number(cant) || 0 } }); setModal(null); });
  const registrarMov = () => call(async () => {
    await api('/cash/movements', { method: 'POST', body: { type: movType, concept: conc, amount: Number(val), method: medio } });
    setModal(null); setConc(''); setVal(''); setMedio('Efectivo');
  });
  const cerrar = () => call(async () => { await api('/cash/close', { method: 'POST', body: { countedCash: Number(contado) } }); setModal(null); setContado(''); });

  const abierta = data?.status === 'open' && !!data?.caja;
  const movs = abierta
    ? data.movimientos.map((m) => ({
        hora: m.date ? new Date(m.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—',
        tipo: { apertura: 'Apertura', venta: 'Venta', egreso: 'Egreso', ingreso: 'Ingreso', retiro: 'Retiro' }[m.type] || m.type,
        detalle: m.concept || m.documentRef || '',
        valor: m.amount,
        medio: m.method || '—',
      }))
    : [];

  const hoyResp = abierta ? data.efectivo : 0;
  const otrosMedios = abierta ? data.otrosMedios : 0;
  const retirosTotal = abierta ? data.retiros : 0;
  const ventasEfectivo = abierta
    ? data.movimientos.filter((m) => m.type === 'venta' && m.method === 'efectivo').reduce((s, m) => s + m.amount, 0)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Caja principal</h1>
          <p className="text-sm text-gray-500">Control de ingresos, egresos y arqueo</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setModal('movimiento')}><ArrowDownCircle size={16} /> Movimiento</Button>
          <Button variant="secondary" onClick={() => setModal('arqueo')}><Calculator size={16} /> Arqueo</Button>
          <Button onClick={() => setModal('apertura')}><Play size={16} /> Abrir caja</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600"><Banknote size={20} /></span>
          <p className="text-xs text-gray-500">Efectivo en caja</p>
          <p className="text-xl font-bold text-green-600">{fmt(hoyResp + (data?.diferencia || 0))}</p>
          {abierta
            ? <Badge color="green">Abierta</Badge>
            : <Badge color="gray">Cerrada</Badge>}
        </Card>
        <Card>
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><ArrowDownCircle size={20} /></span>
          <p className="text-xs text-gray-500">Ventas en efectivo</p>
          <p className="text-xl font-bold text-gray-900">{fmt(ventasEfectivo)}</p>
        </Card>
        <Card>
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><ArrowUpCircle size={20} /></span>
          <p className="text-xs text-gray-500">Otros medios</p>
          <p className="text-xl font-bold text-gray-900">{fmt(otrosMedios)}</p>
        </Card>
        <Card>
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600"><Square size={20} /></span>
          <p className="text-xs text-gray-500">Retiros del día</p>
          <p className="text-xl font-bold text-red-600">{fmt(retirosTotal)}</p>
        </Card>
      </div>

      <Card title="Movimientos de la jornada" subtitle={abierta ? `Caja abierta · Fondo ${fmt(data.caja.openingAmount)}` : 'No hay caja abierta'}>
        <Table
          headers={['Hora', 'Tipo', 'Detalle', 'Medio', 'Valor']}
          rows={movs.map((m, i) => (
            <tr key={i}>
              <td className="px-4 py-3 text-gray-500">{m.hora}</td>
              <td className="px-4 py-3"><Badge color={m.tipo === 'Venta' ? 'green' : m.tipo === 'Egreso' || m.tipo === 'Retiro' ? 'red' : 'blue'}>{m.tipo}</Badge></td>
              <td className="px-4 py-3 text-gray-800">{m.detalle}</td>
              <td className="px-4 py-3 text-gray-600">{m.medio}</td>
              <td className={`px-4 py-3 text-right font-semibold ${m.valor < 0 ? 'text-red-600' : 'text-gray-800'}`}>{m.valor > 0 ? '+' : ''}{fmt(m.valor)}</td>
            </tr>
          ))}
        />
      </Card>

      {modal === 'apertura' && (
        <Modal open onClose={() => setModal(null)} title="Abrir caja">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Caja <b>principal</b> · Responsable: <b>Administrador</b></p>
            <Input label="Fondo de apertura" type="number" value={cant} onChange={(e) => setCant(e.target.value)} />
            {czErr && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{czErr}</div>}
            <div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>Cancelar</Button><Button className="flex-1" disabled={czSaving} onClick={abrir}>{czSaving ? 'Abriendo…' : 'Abrir'}</Button></div>
          </div>
        </Modal>
      )}

      {modal === 'movimiento' && (
        <Modal open onClose={() => setModal(null)} title="Registrar movimiento">
          <div className="space-y-4">
            <Select value={movType} onChange={(e) => setMovType(e.target.value)}>
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </Select>
            <Input label="Concepto / detalle" value={conc} onChange={(e) => setConc(e.target.value)} />
            <Input label="Valor" type="number" value={val} onChange={(e) => setVal(e.target.value)} />
            <Select label="Medio" value={medio} onChange={(e) => setMedio(e.target.value)}><option>Efectivo</option><option>Transferencia</option><option>Nequi</option><option>Tarjeta</option></Select>
            {czErr && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{czErr}</div>}
            <div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>Cancelar</Button><Button className="flex-1" disabled={czSaving || !conc || !Number(val)} onClick={registrarMov}>{czSaving ? 'Guardando…' : 'Guardar'}</Button></div>
          </div>
        </Modal>
      )}

      {modal === 'arqueo' && (
        <Modal open onClose={() => setModal(null)} title="Arqueo de caja" wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gray-500">Efectivo esperado</p><p className="text-lg font-bold">{fmt(hoyResp)}</p></div>
              <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gray-500">Efectivo contado</p><Input type="number" placeholder="Cuente e ingrese" value={contado} onChange={(e) => setContado(e.target.value)} /></div>
              <div className="rounded-lg bg-amber-50 p-3"><p className="text-xs text-amber-700">Ventas efectivo</p><p className="text-lg font-bold">{fmt(ventasEfectivo)}</p></div>
              <div className="rounded-lg bg-violet-50 p-3"><p className="text-xs text-violet-700">Medios electrónicos</p><p className="text-lg font-bold">{fmt(otrosMedios)}</p></div>
            </div>
            {czErr && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{czErr}</div>}
            <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button><Button disabled={czSaving} onClick={cerrar}><Sparkles size={16} /> {czSaving ? 'Cerrando…' : 'Cerrar caja'}</Button></div>
          </div>
        </Modal>
      )}
    </div>
  );
}