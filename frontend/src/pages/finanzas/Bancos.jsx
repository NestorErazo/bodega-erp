import { useState } from 'react';
import { Landmark, Plus, ArrowDownCircle, ArrowUpCircle, ArrowRightLeft } from 'lucide-react';
import { Card, Button, Modal, Table, Input, Select } from '../../components/ui';
import { useResource, fmt, fmtDate } from '../../hooks/useResource';
import { api } from '../../api';
import { mockBancos, mockMovimientosBancarios } from '../../mockData';
import Badge from '../../components/Badge';

export default function Bancos() {
  const { data: bancos } = useResource('/banks', mockBancos);
  const { data: movimientos } = useResource('/banks/movements', mockMovimientosBancarios);
  const [creating, setCreating] = useState(false);
  const [bf, setBf] = useState({ banco: '', cuenta: '', tipo: 'Ahorros', saldoInicial: '' });
  const [savingB, setSavingB] = useState(false);
  const [bErr, setBErr] = useState('');

  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  // Normaliza la API (bank/account/type/date/concept/amount) y el mock (español)
  const normB = (b) => ({
    id: b.id,
    banco: b.banco || b.bank,
    cuenta: b.cuenta || b.account,
    tipo: b.tipo || b.type,
    saldo: b.saldo || ((b.initialBalance || 0) + 0),
    movimientos: b.movimientos,
  });
  const listB = (bancos || []).map(normB);

  const normM = (m) => ({
    id: m.id,
    fecha: m.fecha || m.date,
    banco: m.banco,
    tipo: cap(m.tipo || m.type),
    concepto: m.concepto || m.concept || '',
    valor: m.valor ?? m.amount,
  });
  const listM = (movimientos || []).map(normM).filter((m) => m.banco);

  const totalBancos = listB.reduce((s, b) => s + b.saldo, 0);

  const guardar = async () => {
    setSavingB(true);
    setBErr('');
    try {
      await api('/banks', {
        method: 'POST',
        body: { bank: bf.banco, account: bf.cuenta, type: bf.tipo, initialBalance: Number(bf.saldoInicial) || 0 },
      });
      setCreating(false);
    } catch (e) {
      setBErr(e.message);
    } finally {
      setSavingB(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bancos</h1>
          <p className="text-sm text-gray-500">Cuentas bancarias y movimientos · separado de caja física</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus size={16} /> Nueva cuenta</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {listB.map((b) => (
          <Card key={b.id}>
            <div className="flex items-start justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Landmark size={20} /></span>
              <Badge color="green">Activa</Badge>
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-800">{b.banco}</p>
            <p className="text-xs text-gray-500">{b.cuenta} · {b.tipo}</p>
            <p className="mt-2 text-xl font-bold text-gray-900">{fmt(b.saldo)}</p>
            <p className="text-xs text-gray-400">{b.movimientos} movimientos del mes</p>
          </Card>
        ))}
        <Card>
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600"><Landmark size={20} /></span>
          <p className="text-xs text-gray-500">Saldo total en bancos</p>
          <p className="text-xl font-bold text-green-600">{fmt(totalBancos)}</p>
        </Card>
      </div>

      <Card title="Movimientos bancarios" subtitle="Ingresos, egresos, transferencias y pagos">
        <Table
          headers={['Fecha', 'Cuenta', 'Tipo', 'Concepto', 'Valor']}
          rows={listM.map((m) => (
            <tr key={m.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-600">{fmtDate(m.fecha)}</td>
              <td className="px-4 py-3 font-medium text-gray-800">{m.banco}</td>
              <td className="px-4 py-3">
                <Badge color={m.tipo === 'Ingreso' ? 'green' : m.tipo === 'Egreso' ? 'red' : 'blue'}>
                  {m.tipo === 'Transferencia' ? <ArrowRightLeft size={12} className="mr-1 inline" /> : null}{m.tipo}
                </Badge>
              </td>
              <td className="px-4 py-3 text-gray-700">{m.concepto}</td>
              <td className={`px-4 py-3 text-right font-semibold ${m.valor < 0 ? 'text-red-600' : 'text-green-700'}`}>{m.valor > 0 ? '+' : ''}{fmt(m.valor)}</td>
            </tr>
          ))}
        />
      </Card>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva cuenta bancaria">
        <div className="space-y-4">
          <Input label="Banco" placeholder="Bancolombia, Nequi, Davivienda…" value={bf.banco} onChange={(e) => setBf({ ...bf, banco: e.target.value })} />
          <Input label="Número de cuenta" value={bf.cuenta} onChange={(e) => setBf({ ...bf, cuenta: e.target.value })} />
          <Select label="Tipo" value={bf.tipo} onChange={(e) => setBf({ ...bf, tipo: e.target.value })}><option>Ahorros</option><option>Corriente</option><option>Digital</option></Select>
          <Input label="Saldo inicial" type="number" value={bf.saldoInicial} onChange={(e) => setBf({ ...bf, saldoInicial: e.target.value })} />
          {bErr && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{bErr}</div>}
          <div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setCreating(false)}>Cancelar</Button><Button className="flex-1" disabled={savingB || !bf.banco} onClick={guardar}>{savingB ? 'Guardando…' : 'Guardar'}</Button></div>
        </div>
      </Modal>
    </div>
  );
}